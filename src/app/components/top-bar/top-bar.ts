import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { GameSocketService, Bet } from '../../services/game-socket.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-top-bar',
    standalone: true,
    imports: [CommonModule, ButtonModule],
    templateUrl: './top-bar.html',
    styleUrl: './top-bar.css'
})
export class TopBarComponent implements OnInit, OnDestroy {
    user: any | null = null;
    lastBet: number = 0;
    lastWin: number = 0;

    private subs: Subscription[] = [];

    constructor(
        private authService: AuthService,
        private router: Router,
        private gameSocket: GameSocketService
    ) {
        this.subs.push(
            this.authService.user$.subscribe(user => {
                this.user = user;
            })
        );
    }

    ngOnInit() {
        this.subs.push(
            this.gameSocket.bets$.subscribe(bets => {
                if (!this.user) return;

                const myBets = bets.filter(b => b.userId === this.user.id);

                if (myBets.length > 0) {
                    // Update Last Bet (sum of current active bets)
                    const totalBet = myBets.reduce((sum, b) => sum + b.amount, 0);
                    if (totalBet > 0) {
                        this.lastBet = totalBet;
                    }

                    // Update Last Win (sum of profits)
                    // Note: This resets to specific round wins. 
                    // If we want "Last Win" to persist across rounds even if lost, 
                    // we should only update it if currentWin > 0.
                    const totalWin = myBets.reduce((sum, b) => sum + (b.profit || 0), 0);
                    if (totalWin > 0) {
                        this.lastWin = totalWin;
                    }
                }
            })
        );
    }

    onLogout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    ngOnDestroy() {
        this.subs.forEach(s => s.unsubscribe());
    }
}
