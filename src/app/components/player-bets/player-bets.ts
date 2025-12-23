import { Component, Signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { GameSocketService } from '../../services/game-socket.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-player-bets',
    standalone: true,
    imports: [CommonModule, CardModule],
    templateUrl: './player-bets.html',
    styleUrl: './player-bets.css'
})
export class PlayerBetsComponent {
    bets: Signal<any[]>;
    totalBetsAmount = computed(() => this.bets().reduce((acc, bet) => acc + bet.amount, 0));

    constructor(private gameSocket: GameSocketService) {
        this.bets = toSignal(this.gameSocket.bets$, { initialValue: [] });
    }

    getAvatarUrl(url: string | undefined): string {
        if (!url) return 'assets/default-avatar.png';
        if (url.startsWith('/uploads/')) {
            return `http://localhost:8080${url}`;
        }
        return url;
    }
}
