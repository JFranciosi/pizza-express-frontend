import { Component, OnInit, signal, computed, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameApiService, TopBet } from '../../services/game-api.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-top-bets',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './top-bets.html',
    styleUrl: './top-bets.css'
})
export class TopBets implements OnInit, OnChanges {
    @Input() forceTab: string | null = null;

    private _activeTab = signal('profit');

    activeTab = this._activeTab.asReadonly();

    profitBets = signal<TopBet[]>([]);
    multiplierBets = signal<TopBet[]>([]);

    displayedBets = computed(() => {
        return this._activeTab() === 'profit' ? this.profitBets() : this.multiplierBets();
    });

    isLoading = signal<boolean>(true);

    constructor(private gameApi: GameApiService) { }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['forceTab'] && this.forceTab) {
            this._activeTab.set(this.forceTab);
        }
    }

    ngOnInit() {
        this.loadData();
        setInterval(() => this.loadSilent(), 60000);
    }

    loadData() {
        this.isLoading.set(true);
        this.loadSilent();
    }

    loadSilent() {
        this.gameApi.getTopBets('profit').subscribe({
            next: (data) => {
                this.profitBets.set(data);
                if (this._activeTab() === 'profit') this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });

        this.gameApi.getTopBets('multiplier').subscribe({
            next: (data) => {
                this.multiplierBets.set(data);
                if (this._activeTab() === 'multiplier') this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }

    setTab(tab: string) {
        this._activeTab.set(tab);
    }

    getAvatarUrl(url: string | undefined): string {
        if (!url) return '/assets/default-avatar.png';
        if (url.startsWith('/users/')) {
            return `${environment.apiUrl}${url}`;
        }
        return url;
    }
}
