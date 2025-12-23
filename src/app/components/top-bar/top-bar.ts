import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { GameSocketService, Bet } from '../../services/game-socket.service';
import { Subscription } from 'rxjs';
import { SettingsModalComponent } from '../settings-modal/settings-modal';
import { FairnessModalComponent } from '../fairness-modal/fairness-modal';

@Component({
    selector: 'app-top-bar',
    standalone: true,
    imports: [CommonModule, ButtonModule, SettingsModalComponent, FairnessModalComponent],
    templateUrl: './top-bar.html',
    styleUrl: './top-bar.css'
})
export class TopBarComponent implements OnInit, OnDestroy {
    @ViewChild(SettingsModalComponent) settingsModal!: SettingsModalComponent;
    @ViewChild(FairnessModalComponent) fairnessModal!: FairnessModalComponent;
    user: any | null = null;
    lastBet: number = 0;
    lastWin: number = 0;

    private subs: Subscription[] = [];

    // Audio Player
    private audio: HTMLAudioElement = new Audio('/assets/pizza-soundtrack.mp3');
    public isMuted: boolean = true;

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

        // Configure audio
        this.audio.loop = true;
        this.audio.volume = 0.3; // Set a reasonable volume
    }

    ngOnInit() {
        this.subs.push(
            this.gameSocket.bets$.subscribe(bets => {
                if (!this.user) return;

                const myBets = bets.filter(b => b.userId === this.user.id);

                if (myBets.length > 0) {
                    const totalBet = myBets.reduce((sum, b) => sum + b.amount, 0);
                    if (totalBet > 0) {
                        this.lastBet = totalBet;
                    }
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

    openSettings() {
        this.settingsModal.show();
    }

    openFairness() {
        this.fairnessModal.show();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (!this.isMuted) {
            this.audio.play().catch(e => {
                console.error("Error playing audio:", e);
                this.isMuted = true; // Revert if playback fails (e.g. browser block)
            });
        } else {
            this.audio.pause();
        }
    }

    ngOnDestroy() {
        this.subs.forEach(s => s.unsubscribe());
        this.audio.pause();
        this.audio = null!;
    }
}
