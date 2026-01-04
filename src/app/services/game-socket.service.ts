import { Injectable, OnDestroy, NgZone, signal, WritableSignal, computed } from '@angular/core';
import { timer } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
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

    // State Signals
    private _gameState = signal<GameState>(GameState.WAITING);
    public readonly gameState = this._gameState.asReadonly();

    private _multiplier = signal<number>(1.00);
    public readonly multiplier = this._multiplier.asReadonly();

    private _timeLeft = signal<number>(0);
    public readonly timeLeft = this._timeLeft.asReadonly();

    private _bets = signal<Bet[]>([]);
    public readonly bets = this._bets.asReadonly();

    private _history = signal<HistoryItem[]>([]);
    public readonly history = this._history.asReadonly();

    private _currentHash = signal<string>('');
    public readonly currentHash = this._currentHash.asReadonly();

    private _lastSecret = signal<string>('');
    public readonly lastSecret = this._lastSecret.asReadonly();

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

                this._bets.update(bets => {
                    const existingIndex = bets.findIndex(b => b.userId === bet.userId && b.index === bet.index);
                    if (existingIndex === -1) {
                        return [...bets, bet];
                    } else {
                        const updated = [...bets];
                        updated[existingIndex] = { ...updated[existingIndex], ...bet };
                        return updated;
                    }
                });

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

                this._bets.update(bets => bets.filter(b => !(b.userId === userId && b.index === index)));

            } else if (message.startsWith('STATE:')) {
                const parts = message.split(':');
                let statusStr = parts[1];
                if (statusStr === 'RUNNING') statusStr = 'FLYING';

                const state = statusStr as GameState;
                this._gameState.set(state);

                if (state === GameState.WAITING) {
                    this._bets.set([]);
                }

                if (parts.length > 2) {
                    const mult = parseFloat(parts[2]);
                    if (!isNaN(mult)) {
                        this._multiplier.set(mult);
                    }
                } else if (state === GameState.FLYING) {
                    this._multiplier.set(1.00);
                }
            } else if (message.startsWith('TICK:')) {
                const mult = parseFloat(message.split(':')[1]);
                if (!isNaN(mult)) {
                    this._multiplier.set(mult);
                }
            } else if (message.startsWith('CRASH:')) {
                const parts = message.split(':');
                const mult = parseFloat(parts[1]);
                const secret = parts.length > 2 ? parts[2] : undefined;

                this._gameState.set(GameState.CRASHED);
                this._multiplier.set(mult);

                const newItem: HistoryItem = { multiplier: mult, secret };
                this._history.update(history => [newItem, ...history].slice(0, 200));

                this._bets.set([]);

                if (secret) {
                    this._lastSecret.set(secret);
                }

            } else if (message.startsWith('HASH:')) {
                const hash = message.split(':')[1];
                this._currentHash.set(hash);
                this._lastSecret.set('');

            } else if (message.startsWith('TIMER:')) {
                const seconds = parseInt(message.split(':')[1], 10);
                this._timeLeft.set(seconds);
            } else if (message === 'TAKEOFF') {
                this._gameState.set(GameState.FLYING);
                this._multiplier.set(1.00);
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
                    this._history.set(items);
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
            this._bets.update(bets => {
                const alreadyWon = bets.find(b => b.userId === userId && b.index === index && b.profit === profit);
                if (alreadyWon) return bets;

                return bets.map(b => {
                    if (b.userId === userId && b.index === index) {
                        return { ...b, multiplier, profit };
                    }
                    return b;
                });
            });
        });
    }

    addBet(bet: Bet) {
        this.zone.run(() => {
            this._bets.update(bets => {
                if (bets.some(b => b.userId === bet.userId && b.index === bet.index)) {
                    return bets;
                }
                return [...bets, bet];
            });
        });
    }

    removeBet(userId: string, index: number) {
        this.zone.run(() => {
            this._bets.update(bets => bets.filter(b => !(b.userId === userId && b.index === index)));
        });
    }

    ngOnDestroy() {
        if (this.socket$) {
            this.socket$.complete();
        }
    }
}
