import { Component, Signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { RouterLink } from '@angular/router';
import { GameSocketService } from '../../services/game-socket.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-player-bets',
    standalone: true,
    imports: [CommonModule, CardModule, RouterLink],
    templateUrl: './player-bets.html',
    styleUrl: './player-bets.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerBetsComponent {
    bets: Signal<any[]>;
    totalBetsAmount = computed(() => this.bets().reduce((acc, bet) => acc + bet.amount, 0));

    constructor(private gameSocket: GameSocketService) {
        this.bets = toSignal(this.gameSocket.bets$, { initialValue: [] });
    }

    getAvatarUrl(url: string | undefined): string {
        if (!url) return '/assets/default-avatar.png';
        if (url.startsWith('/users/')) {
            return `${environment.apiUrl}${url}`;
        }
        return url;
    }
}
