import { Component, Signal, computed, ChangeDetectionStrategy, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

import { GameSocketService, Bet } from '../../services/game-socket.service';
import { environment } from '../../../environments/environment';
import { TopBets } from '../top-bets/top-bets';
import { ProvablyFairFooter } from '../provably-fair-footer/provably-fair-footer';

@Component({
    selector: 'app-player-bets',
    standalone: true,
    imports: [CommonModule, CardModule, TopBets, ProvablyFairFooter],
    templateUrl: './player-bets.html',
    styleUrl: './player-bets.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerBets {
    @ViewChild(TopBets) topBetsComponent!: TopBets;

    bets: Signal<Bet[]>;
    totalBetsAmount = computed(() => this.bets().reduce((acc, bet) => acc + bet.amount, 0));

    view = signal<'live' | 'top'>('live');
    activeTopBetTab = signal<'profit' | 'multiplier'>('profit');

    constructor(private gameSocket: GameSocketService) {
        this.bets = this.gameSocket.bets;
    }

    setView(v: 'live' | 'top') {
        this.view.set(v);
    }

    refreshTopBets() {
        if (this.topBetsComponent) {
            this.topBetsComponent.loadData();
        }
    }

    getAvatarUrl(bet: Bet): string {
        if (!bet || !bet.avatarUrl) return '/assets/default-avatar.png';
        if (bet.avatarUrl.startsWith('data:')) return bet.avatarUrl;
        if (bet.avatarUrl.startsWith('/users/')) {
            return `${environment.apiUrl}${bet.avatarUrl}`;
        }
        if (bet.userId) {
            return `${environment.apiUrl}/users/${bet.userId}/avatar`;
        }
        return '/assets/default-avatar.png';
    }
}
