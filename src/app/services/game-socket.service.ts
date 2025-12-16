import { Injectable, OnDestroy } from '@angular/core';
import { Subject, BehaviorSubject, Observable, Subscription, timer } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { retryWhen, delay, tap } from 'rxjs/operators';

export enum GameState {
    WAITING = 'WAITING',
    FLYING = 'FLYING',
    CRASHED = 'CRASHED'
}

export interface Bet {
    userId: string;
    username: string;
    amount: number;
}

@Injectable({
    providedIn: 'root'
})
export class GameSocketService implements OnDestroy {
    private socket$: WebSocketSubject<any> | undefined;
    private readonly WS_ENDPOINT = 'ws://localhost:8080/game';

    private gameStateSub = new BehaviorSubject<GameState>(GameState.WAITING);
    public gameState$ = this.gameStateSub.asObservable();

    private multiplierSub = new BehaviorSubject<number>(1.00);
    public multiplier$ = this.multiplierSub.asObservable();

    private timeLeftSub = new BehaviorSubject<number>(0);
    public timeLeft$ = this.timeLeftSub.asObservable();

    private betsSub = new BehaviorSubject<Bet[]>([]);
    public bets$ = this.betsSub.asObservable();

    private historySub = new BehaviorSubject<number[]>([]);
    public history$ = this.historySub.asObservable();

    constructor() {
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
        if (message.startsWith('STATE:')) {
            const parts = message.split(':');
            let statusStr = parts[1];
            if (statusStr === 'RUNNING') statusStr = 'FLYING';

            const state = statusStr as GameState;
            this.gameStateSub.next(state);

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
            const mult = parseFloat(message.split(':')[1]);
            this.gameStateSub.next(GameState.CRASHED);
            this.multiplierSub.next(mult);

            // Aggiungi il nuovo crash alla history locale
            const currentHistory = this.historySub.getValue();
            this.historySub.next([mult, ...currentHistory].slice(0, 50)); // Mantieni ultimi 50

        } else if (message.startsWith('TIMER:')) {
            const seconds = parseInt(message.split(':')[1], 10);
            this.timeLeftSub.next(seconds);
        } else if (message === 'TAKEOFF') {
            this.gameStateSub.next(GameState.FLYING);
            this.multiplierSub.next(1.00);
        } else if (message.startsWith('HISTORY:')) {
            // HISTORY:1.20,5.50,1.00
            const csv = message.substring(8); // Rimuovi "HISTORY:"
            if (csv.length > 0) {
                const numbers = csv.split(',').map(s => parseFloat(s));
                this.historySub.next(numbers);
            }
        }
    }

    sendMessage(msg: string) {
        if (this.socket$) {
            this.socket$.next(msg);
        }
    }

    ngOnDestroy() {
        if (this.socket$) {
            this.socket$.complete();
        }
    }
}
