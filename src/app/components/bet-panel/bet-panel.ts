
import { Component, effect, computed, Signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { AuthService } from '../../services/auth.service';
import { GameApiService } from '../../services/game-api.service';
import { GameSocketService, GameState } from '../../services/game-socket.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-bet-panel',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputNumberModule, ToggleSwitchModule, DialogModule],
    templateUrl: './bet-panel.html',
    styleUrl: './bet-panel.css'
})
export class BetPanelComponent {
    @Input() index: number = 0;

    betAmount: number = 5.00;
    autoCashout: number = 2.00;
    isAutoCashoutEnabled: boolean = false;

    // Error Modal State
    errorVisible: boolean = false;
    errorMessage: string = '';

    gameState: Signal<GameState>;
    currentMultiplier: Signal<number>;
    timeLeft: Signal<number>;

    betPlaced: boolean = false;
    cashedOut: boolean = false;
    isAutoBetEnabled: boolean = false;
    // lastWin and lastBet removed as they are now global in TopBar

    constructor(
        private authService: AuthService,
        private gameApi: GameApiService,
        private gameSocket: GameSocketService
    ) {
        this.gameState = toSignal(this.gameSocket.gameState$, { initialValue: GameState.WAITING });
        this.currentMultiplier = toSignal(this.gameSocket.multiplier$, { initialValue: 1.00 });
        this.timeLeft = toSignal(this.gameSocket.timeLeft$, { initialValue: 0 });

        // Listen for bets to sync state
        this.gameSocket.bets$.subscribe(bets => {
            const user = this.authService.getUser();
            if (user) {
                // Filter by userId AND index
                const myBet = bets.find(b => b.userId === user.id && b.index === this.index);
                if (myBet) {
                    // Sync state if backend says we placed a bet (e.g. page reload)
                    if (!this.betPlaced && this.gameState() === GameState.WAITING) {
                        this.betPlaced = true;
                        this.betAmount = myBet.amount;
                    }

                    if (myBet.profit && myBet.profit > 0) {
                        this.cashedOut = true;
                    }
                }
            }
        });

        effect(() => {
            const state = this.gameState();

            // Reset state when game crashes
            if (state === GameState.CRASHED) {
                this.betPlaced = false;
                this.cashedOut = false;
            }

            // Handle Auto Bet when entering Waiting state
            if (state === GameState.WAITING) {
                if (this.isAutoBetEnabled && !this.betPlaced) {
                    // Small delay to ensure state stability and UX
                    setTimeout(() => {
                        if (!this.betPlaced && this.gameState() === GameState.WAITING && this.isAutoBetEnabled) {
                            this.placeBet();
                        }
                    }, 500);
                }
            }
        }, { allowSignalWrites: true });
    }

    addToBet(amount: number) {
        this.betAmount = Math.min(this.betAmount + amount, 100);
    }

    setBet(amount: number) {
        this.betAmount = amount;
    }

    placeBet() {
        if (this.betAmount > 100) {
            this.showError('Max bet is 100€');
            return;
        }
        if (this.betPlaced) return;

        this.betPlaced = true;

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
                this.showError((err.error?.error || 'Bet Failed'));
                // TODO: Remove the optimistic bet if failure? 
                // Currently GameSocket handles the stream, removing a specific bet locally is hard without strict ID. 
                // But the next WAITING state will satisfy clearing.
            }
        });
    }

    cancelBet() {
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
                this.showError('Check failed');
            }
        });
    }

    cashOut() {
        if (!this.betPlaced || this.cashedOut) return;

        this.cashedOut = true;

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
                this.showError('Cashout failed');
            }
        });
    }

    get isBettingDisabled(): boolean {
        return this.gameState() !== GameState.WAITING || this.betPlaced;
    }

    showError(msg: string) {
        this.errorMessage = msg;
        this.errorVisible = true;
    }

    get isCashoutDisabled(): boolean {
        return this.gameState() !== GameState.FLYING || !this.betPlaced || this.cashedOut;
    }
}
