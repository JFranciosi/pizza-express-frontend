import { Injectable, OnDestroy, NgZone } from '@angular/core';
import { Subject, BehaviorSubject, Observable, Subscription, timer } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { retryWhen, delay, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export enum GameState {
    WAITING = 'WAITING',
    FLYING = 'FLYING',
    CRASHED = 'CRASHED'
}

export interface Bet {
    userId: string;
    username: string;
    amount: number;
    multiplier?: number | null;
    profit?: number | null;
    index: number;
    avatarUrl?: string;
}

export interface HistoryItem {
    multiplier: number;
    secret?: string;
}

@Injectable({
    providedIn: 'root'
})
export class GameSocketService implements OnDestroy {
    private socket$: WebSocketSubject<any> | undefined;
    private readonly WS_ENDPOINT = `${environment.wsUrl}/game`;

    private gameStateSub = new BehaviorSubject<GameState>(GameState.WAITING);
    public gameState$ = this.gameStateSub.asObservable();

    private multiplierSub = new BehaviorSubject<number>(1.00);
    public multiplier$ = this.multiplierSub.asObservable();

    private timeLeftSub = new BehaviorSubject<number>(0);
    public timeLeft$ = this.timeLeftSub.asObservable();

    private betsSub = new BehaviorSubject<Bet[]>([]);
    public bets$ = this.betsSub.asObservable();

    private historySub = new BehaviorSubject<HistoryItem[]>([]);
    public history$ = this.historySub.asObservable();

    private currentHashSub = new BehaviorSubject<string>('');
    public currentHash$ = this.currentHashSub.asObservable();

    private lastSecretSub = new BehaviorSubject<string>('');
    public lastSecret$ = this.lastSecretSub.asObservable();

    constructor(private zone: NgZone) {
        this.connect();
    }

    private connect() {
        this.socket$ = webSocket({
            url: this.WS_ENDPOINT,
            deserializer: msg => msg.data,
            openObserver: {
                next: () => console.log('WebSocket connected')
            },
            closeObserver: {
                next: () => {
                    console.log('WebSocket closed, retrying...');
                    this.reconnect();
                }
            }
        });

        this.socket$.subscribe(
            (message: string) => this.handleMessage(message),
            err => console.error('WebSocket error:', err)
        );
    }

    private reconnect() {
        timer(3000).subscribe(() => this.connect());
    }

    private handleMessage(message: string) {
        this.zone.run(() => {
            if (message.startsWith('BET:') && !message.startsWith('BET_OK')) {
                const parts = message.split(':');
                const bet: Bet = {
                    userId: parts[1],
                    username: parts[2],
                    amount: parseFloat(parts[3]),
                    multiplier: null,
                    profit: null,
                    index: parts.length > 4 ? parseInt(parts[4]) : 0,
                    avatarUrl: parts.length > 5 ? parts.slice(5).join(':') : undefined
                };

                const currentBets = this.betsSub.getValue();
                const existingIndex = currentBets.findIndex(b => b.userId === bet.userId && b.index === bet.index);

                if (existingIndex === -1) {
                    this.betsSub.next([...currentBets, bet]);
                } else {
                    // Update existing bet (e.g. from optimistic to confirmed)
                    const updatedBets = [...currentBets];
                    updatedBets[existingIndex] = { ...updatedBets[existingIndex], ...bet };
                    this.betsSub.next(updatedBets);
                }

            } else if (message.startsWith('CASHOUT:') && !message.startsWith('CASHOUT_OK')) {
                const parts = message.split(':');
                const userId = parts[1];
                const multiplier = parseFloat(parts[2]);
                const profit = parseFloat(parts[3]);
                const index = parts.length > 4 ? parseInt(parts[4]) : 0;

                this.notifyPlayerWin(userId, index, multiplier, profit);

            } else if (message.startsWith('CANCEL_BET:')) {
                const parts = message.split(':');
                const userId = parts[1];
                const index = parts.length > 2 ? parseInt(parts[2]) : 0;

                const currentBets = this.betsSub.getValue();
                this.betsSub.next(currentBets.filter(b => !(b.userId === userId && b.index === index)));

            } else if (message.startsWith('STATE:')) {
                const parts = message.split(':');
                let statusStr = parts[1];
                if (statusStr === 'RUNNING') statusStr = 'FLYING';

                const state = statusStr as GameState;
                this.gameStateSub.next(state);

                if (state === GameState.WAITING) {
                    this.betsSub.next([]);
                }

                if (parts.length > 2) {
                    const mult = parseFloat(parts[2]);
                    if (!isNaN(mult)) {
                        this.multiplierSub.next(mult);
                    }
                }
            } else if (message.startsWith('TICK:')) {
                const mult = parseFloat(message.split(':')[1]);
                if (!isNaN(mult)) {
                    this.multiplierSub.next(mult);
                }
            } else if (message.startsWith('CRASH:')) {
                const parts = message.split(':');
                const mult = parseFloat(parts[1]);
                const secret = parts.length > 2 ? parts[2] : undefined;

                this.gameStateSub.next(GameState.CRASHED);
                this.multiplierSub.next(mult);

                const currentHistory = this.historySub.getValue();
                const newItem: HistoryItem = { multiplier: mult, secret };
                this.historySub.next([newItem, ...currentHistory].slice(0, 200));

                this.betsSub.next([]);

                if (secret) {
                    this.lastSecretSub.next(secret);
                }

            } else if (message.startsWith('HASH:')) {
                const hash = message.split(':')[1];
                this.currentHashSub.next(hash);
                this.lastSecretSub.next('');

            } else if (message.startsWith('TIMER:')) {
                const seconds = parseInt(message.split(':')[1], 10);
                this.timeLeftSub.next(seconds);
            } else if (message === 'TAKEOFF') {
                this.gameStateSub.next(GameState.FLYING);
                this.multiplierSub.next(1.00);
            } else if (message.startsWith('HISTORY:')) {
                const csv = message.substring(8);
                if (csv.length > 0) {
                    const items: HistoryItem[] = csv.split(',').map(s => {
                        const p = s.split(':');
                        if (p.length > 1) {
                            return { multiplier: parseFloat(p[0]), secret: p[1] };
                        }
                        return { multiplier: parseFloat(p[0]) };
                    });
                    this.historySub.next(items);
                }
            }
        });
    }

    sendMessage(msg: string) {
        if (this.socket$) {
            this.socket$.next(msg);
        }
    }

    notifyPlayerWin(userId: string, index: number, multiplier: number, profit: number) {
        this.zone.run(() => {
            const currentBets = this.betsSub.getValue();
            const alreadyWon = currentBets.find(b => b.userId === userId && b.index === index && b.profit === profit);
            if (alreadyWon) return;

            const updatedBets = currentBets.map(b => {
                if (b.userId === userId && b.index === index) {
                    return { ...b, multiplier, profit };
                }
                return b;
            });
            this.betsSub.next(updatedBets);
        });
    }

    addBet(bet: Bet) {
        this.zone.run(() => {
            const currentBets = this.betsSub.getValue();
            if (currentBets.some(b => b.userId === bet.userId && b.index === bet.index)) {
                return;
            }
            this.betsSub.next([...currentBets, bet]);
        });
    }

    removeBet(userId: string, index: number) {
        this.zone.run(() => {
            const currentBets = this.betsSub.getValue();
            this.betsSub.next(currentBets.filter(b => !(b.userId === userId && b.index === index)));
        });
    }

    ngOnDestroy() {
        if (this.socket$) {
            this.socket$.complete();
        }
    }
}
