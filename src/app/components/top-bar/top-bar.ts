import { Component, OnInit, OnDestroy, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { GameSocketService } from '../../services/game-socket.service';
import { Subscription } from 'rxjs';
import { SettingsModal } from '../settings-modal/settings-modal';
import { FairnessModal } from '../fairness-modal/fairness-modal';
import { SoundService } from '../../services/sound.service';
import { ToolbarModule } from 'primeng/toolbar';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { environment } from '../../../environments/environment';


@Component({
    selector: 'app-top-bar',
    standalone: true,
    imports: [CommonModule, ToolbarModule, ButtonModule, FormsModule, AvatarModule, MenuModule, SettingsModal, FairnessModal],
    templateUrl: './top-bar.html',
    styleUrl: './top-bar.css'
})
export class TopBar implements OnInit, OnDestroy {
    @ViewChild(SettingsModal) settingsModal!: SettingsModal;
    @ViewChild(FairnessModal) fairnessModal!: FairnessModal;
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

        effect(() => {
            const bets = this.gameSocket.bets();
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
        });


        this.audio.loop = true;
        this.audio.volume = this.musicVolume / 100;
    }

    ngOnInit() {
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

    getAvatarUrl(user: any): string {
        if (!user || !user.avatarUrl) return 'assets/default-avatar.png';
        if (user.avatarUrl.startsWith('data:') || user.avatarUrl.startsWith('http')) {
            return user.avatarUrl;
        }
        if (user.avatarUrl.startsWith('/')) {
            return `${environment.apiUrl}${user.avatarUrl}`;
        }
        return `${environment.apiUrl}/users/${user.id}/avatar`;
    }

    ngOnDestroy() {
        this.subs.forEach(s => s.unsubscribe());
        this.audio.pause();
        this.audio = null!;
    }
}
