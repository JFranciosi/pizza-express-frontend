import { Component, effect, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { AuthService } from '../../services/auth.service';
import { GameApiService } from '../../services/game-api.service';
import { GameSocketService, GameState } from '../../services/game-socket.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-bet-controls',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputNumberModule, ToggleSwitchModule],
    templateUrl: './bet-controls.html',
    styleUrl: './bet-controls.css'
})
export class BetControlsComponent {
    betAmount: number = 5.00;
    autoCashout: number = 2.00;
    isAutoCashoutEnabled: boolean = false;

    gameState: Signal<GameState>;
    currentMultiplier: Signal<number>;
    timeLeft: Signal<number>;

    betPlaced: boolean = false;
    cashedOut: boolean = false;

    constructor(
        private authService: AuthService,
        private gameApi: GameApiService,
        private gameSocket: GameSocketService
    ) {
        this.gameState = toSignal(this.gameSocket.gameState$, { initialValue: GameState.WAITING });
        this.currentMultiplier = toSignal(this.gameSocket.multiplier$, { initialValue: 1.00 });
        this.timeLeft = toSignal(this.gameSocket.timeLeft$, { initialValue: 0 });

        effect(() => {
            // Reset state when game crashes (prepared for next round)
            if (this.gameState() === GameState.CRASHED) {
                this.betPlaced = false;
                this.cashedOut = false;
            }
        });
    }

    addToBet(amount: number) {
        this.betAmount = Math.min(this.betAmount + amount, 100);
    }

    setBet(amount: number) {
        this.betAmount = amount;
    }

    placeBet() {
        if (this.betAmount > 100) {
            alert('Max bet is 100€');
            return;
        }
        if (this.betPlaced) return;

        // Optimistic update: Prevent double clicks immediately
        this.betPlaced = true;

        // Send autoCashout only if enabled
        const autoCashoutValue = this.isAutoCashoutEnabled ? this.autoCashout : 0;

        this.gameApi.placeBet(this.betAmount, autoCashoutValue).subscribe({
            next: () => {
                // Success: Update balance
                const user = this.authService.getUser();
                if (user) {
                    this.authService.updateBalance(user.balance - this.betAmount);
                }
            },
            error: (err: any) => {
                console.error('Bet failed', err);
                // Revert state on failure
                this.betPlaced = false;
                alert('Bet failed: ' + (err.error?.error || 'Unknown error'));
            }
        });
    }

    cancelBet() {
        if (!this.betPlaced) return;

        this.gameApi.cancelBet().subscribe({
            next: () => {
                this.betPlaced = false;
                const user = this.authService.getUser();
                if (user) {
                    this.authService.updateBalance(user.balance + this.betAmount);
                }
            },
            error: (err: any) => console.error('Cancel bet failed', err)
        });
    }

    cashOut() {
        if (!this.betPlaced || this.cashedOut) return;

        this.gameApi.cashOut().subscribe({
            next: (response: any) => {
                this.cashedOut = true;
                // Use authoritative data from backend
                const winAmount = response.winAmount;
                const newBalance = response.newBalance;

                this.authService.updateBalance(newBalance);
                console.log(`Cashout success: Won ${winAmount} at ${response.multiplier}x. New Balance: ${newBalance}`);
            },
            error: (err: any) => console.error('Cashout failed', err)
        });
    }

    get isBettingDisabled(): boolean {
        return this.gameState() !== GameState.WAITING || this.betPlaced;
    }

    get isCashoutDisabled(): boolean {
        return this.gameState() !== GameState.FLYING || !this.betPlaced || this.cashedOut;
    }
}
