import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { GameSocketService, Bet } from '../../services/game-socket.service';
import { Subscription } from 'rxjs';
import { SettingsModalComponent } from '../settings-modal/settings-modal';
import { FairnessModalComponent } from '../fairness-modal/fairness-modal';
import { SoundService } from '../../services/sound.service';

@Component({
    selector: 'app-top-bar',
    standalone: true,
    imports: [CommonModule, ButtonModule, FormsModule, SettingsModalComponent, FairnessModalComponent],
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


    private audio: HTMLAudioElement = new Audio('/assets/pizza-soundtrack.mp3');
    public isMusicMuted: boolean = true;
    public isSfxMuted: boolean = true;
    public musicVolume: number = 15;


    public showVolumeControls: boolean = false;

    constructor(
        private authService: AuthService,
        private router: Router,
        private gameSocket: GameSocketService,
        private soundService: SoundService
    ) {
        this.subs.push(
            this.authService.user$.subscribe(user => {
                this.user = user;
            })
        );


        this.audio.loop = true;
        this.audio.volume = this.musicVolume / 100;
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
        this.audio.pause();
        this.soundService.stopAll();
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    openSettings() {
        this.settingsModal.show();
    }

    openFairness() {
        this.fairnessModal.show();
    }

    toggleMusic() {
        this.isMusicMuted = !this.isMusicMuted;
        if (!this.isMusicMuted) {
            this.audio.play().catch(e => {
                console.error("Error playing audio:", e);
                this.isMusicMuted = true;
            });
        } else {
            this.audio.pause();
        }
    }

    onVolumeChange() {
        this.audio.volume = this.musicVolume / 100;
    }

    toggleSfx() {
        this.isSfxMuted = !this.isSfxMuted;
        this.soundService.setMuted(this.isSfxMuted);
    }

    onAvatarError(event: any) {
        event.target.src = 'assets/default-avatar.png';
    }

    getAvatarUrl(url: string | undefined): string {
        if (!url) return 'assets/default-avatar.png';
        if (url.startsWith('/uploads/')) {
            return `http://localhost:8080${url}`;
        }
        return url;
    }

    ngOnDestroy() {
        this.subs.forEach(s => s.unsubscribe());
        this.audio.pause();
        this.audio = null!;
    }
}
