import { Component, effect, computed, Signal, Input, ChangeDetectionStrategy, ChangeDetectorRef, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { AuthService } from '../../services/auth.service';
import { GameApiService } from '../../services/game-api.service';
import { GameSocketService, GameState } from '../../services/game-socket.service';
import { SoundService } from '../../services/sound.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-bet-panel',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputNumberModule, ToggleSwitchModule],
    templateUrl: './bet-panel.html',
    styleUrl: './bet-panel.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BetPanel {
    @Input() index: number = 0;
    @Input() multiplier: number = 1.0;

    betAmount: number = 5.00;
    autoCashout: number = 2.00;
    isAutoCashoutEnabled: boolean = false;

    gameState: Signal<GameState>;
    currentMultiplier: Signal<number>;
    timeLeft: Signal<number>;

    betPlaced: boolean = false;
    cashedOut: boolean = false;
    nextRoundBet: boolean = false;
    isAutoBetEnabled: boolean = false;

    constructor(
        private authService: AuthService,
        private gameApi: GameApiService,
        private gameSocket: GameSocketService,
        private soundService: SoundService,
        private cdr: ChangeDetectorRef,
        private injector: Injector
    ) {
        this.gameState = this.gameSocket.gameState;
        this.currentMultiplier = this.gameSocket.multiplier;
        this.timeLeft = this.gameSocket.timeLeft;
        effect(() => {
            const bets = this.gameSocket.bets();
            const user = this.authService.getUser();
            if (user) {
                const myBet = bets.find(b => b.userId === user.id && b.index === this.index);
                if (myBet) {
                    if (!this.betPlaced && this.gameState() === GameState.WAITING) {
                        this.betPlaced = true;
                        this.betAmount = myBet.amount;
                        this.cdr.markForCheck();
                    }

                    if (myBet.profit && myBet.profit > 0) {
                        this.cashedOut = true;
                        this.cdr.markForCheck();
                    }
                }
            }
        }, { injector: this.injector });

        effect(() => {
            const state = this.gameState();

            if (state === GameState.CRASHED) {
                this.betPlaced = false;
                this.cashedOut = false;
            }

            if (state === GameState.FLYING && this.betPlaced && !this.cashedOut && this.isAutoCashoutEnabled) {
                if (this.currentMultiplier() >= this.autoCashout) {
                    this.cashedOut = true;
                }
            }

            if (state === GameState.WAITING) {
                if (this.nextRoundBet) {
                    this.placeBet();
                }
                else if (this.isAutoBetEnabled && !this.betPlaced) {
                    this.placeBet();
                }
            }
        }, { injector: this.injector });
    }

    addToBet(amount: number) {
        this.betAmount = Math.min(this.betAmount + amount, 100);
        this.cdr.markForCheck();
    }

    setBet(amount: number) {
        this.betAmount = amount;
        this.cdr.markForCheck();
    }

    placeBet() {
        if (this.gameState() !== GameState.WAITING) {
            if (!this.betPlaced) {
                this.nextRoundBet = true;
            }
            return;
        }

        if (this.betAmount > 100) {
            console.warn('Max bet is 100€');
            return;
        }
        if (this.betPlaced) return;

        this.betPlaced = true;
        this.nextRoundBet = false;

        const user = this.authService.getUser();
        if (user) {
            const optimisticBet = {
                userId: user.id,
                username: user.username,
                amount: this.betAmount,
                index: this.index,
                multiplier: null,
                profit: null,
                avatarUrl: user.avatarUrl
            };
            this.gameSocket.addBet(optimisticBet);
        }

        const autoCashoutValue = this.isAutoCashoutEnabled ? this.autoCashout : 0;

        this.gameApi.placeBet(this.betAmount, autoCashoutValue, this.index).subscribe({
            next: () => {
                const user = this.authService.getUser();
                if (user) {
                    this.authService.updateBalance(user.balance - this.betAmount);
                }
            },
            error: (err: any) => {
                console.error('Bet failed', err);
                this.betPlaced = false;
                console.error('Bet failed', err);
                this.betPlaced = false;
                this.cdr.markForCheck();
                this.cdr.markForCheck();
            }
        });
    }

    cancelBet() {
        if (this.nextRoundBet) {
            this.nextRoundBet = false;
            return;
        }

        if (!this.betPlaced) return;

        this.betPlaced = false;
        const user = this.authService.getUser();
        if (user) {
            this.gameSocket.removeBet(user.id, this.index);
        }

        this.gameApi.cancelBet(this.index).subscribe({
            next: () => {
                const user = this.authService.getUser();
                if (user) {
                    this.authService.updateBalance(user.balance + this.betAmount);
                }
            },
            error: (err: any) => {
                console.error('Cancel bet failed', err);
                this.betPlaced = true;
                console.error('Cancel bet failed', err);
                this.betPlaced = true;
            }
        });
    }

    cashOut() {
        if (!this.betPlaced || this.cashedOut) return;

        this.cashedOut = true;
        this.soundService.playCashout();

        const user = this.authService.getUser();
        if (user) {
            const currentMult = this.currentMultiplier();
            const estimatedWin = this.betAmount * currentMult;
            this.gameSocket.notifyPlayerWin(user.id, this.index, currentMult, estimatedWin);
        }

        this.gameApi.cashOut(this.index).subscribe({
            next: (response: any) => {
                const winAmount = response.winAmount;
                const newBalance = response.newBalance;

                this.authService.updateBalance(newBalance);

                if (user) {
                    const currentMult = this.currentMultiplier();
                    this.gameSocket.notifyPlayerWin(user.id, this.index, currentMult, winAmount);
                }
            },
            error: (err: any) => {
                console.error('Cashout failed', err);
                this.cashedOut = false;
                console.error('Cashout failed', err);
                this.cashedOut = false;
                this.cdr.markForCheck();
            }
        });
    }

    get isBettingDisabled(): boolean {
        return this.gameState() !== GameState.WAITING || this.betPlaced;
    }



    get isCashoutDisabled(): boolean {
        return this.gameState() !== GameState.FLYING || !this.betPlaced || this.cashedOut;
    }
}
