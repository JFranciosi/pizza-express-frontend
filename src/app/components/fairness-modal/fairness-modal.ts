import { Component, Signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { GameSocketService } from '../../services/game-socket.service';
import { FairnessService } from '../../services/fairness.service';

import { FormsModule } from '@angular/forms';

import { GameApiService } from '../../services/game-api.service';

@Component({
    selector: 'app-fairness-modal',
    standalone: true,
    imports: [CommonModule, DialogModule, ButtonModule, FormsModule],
    templateUrl: './fairness-modal.html',
    styleUrl: './fairness-modal.css'
})
export class FairnessModal implements OnInit {
    visible: boolean = false;

    currentHash: Signal<string>;
    lastSecret: Signal<string>;

    verifySecret: string = '';
    verifyHash: string | null = null;
    verifyResult: number | null = null;
    calculationSteps: string = '';

    activeCommitment: string | null = null;
    remainingGames: number | null = null;

    constructor(
        private gameSocket: GameSocketService,
        private fairnessService: FairnessService,
        private gameApi: GameApiService
    ) {
        this.currentHash = this.gameSocket.currentHash;
        this.lastSecret = this.gameSocket.lastSecret;

        this.fairnessService.openModal$.subscribe(data => {
            if (data) {
                this.show(data.secret);
            } else {
                this.show();
            }
        });
    }

    ngOnInit() {
    }

    show(secret?: string) {
        this.visible = true;
        this.loadFairnessData();
        if (secret) {
            this.verifySecret = secret;
            this.verify(); // Auto verify
        }
    }

    loadFairnessData() {
        this.gameApi.getFairness().subscribe({
            next: (data) => {
                this.activeCommitment = data.activeCommitment;
                this.remainingGames = data.remainingGames;
            },
            error: (err) => console.error('Failed to load fairness data', err)
        });
    }

    copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
    }

    async verify() {
        if (!this.verifySecret) return;
        this.verifyHash = await this.sha256(this.verifySecret);
        this.verifyResult = this.calculateCrashPoint(this.verifyHash);
    }

    private async sha256(message: string): Promise<string> {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    private calculateCrashPoint(hash: string): number {
        const hex = hash.substring(0, 13);
        const h = parseInt(hex, 16);
        const e = Math.pow(2, 52);

        const x = h / e;
        const multiplier = 0.99 / (1.0 - x);

        const final = Math.max(1.00, Math.min(multiplier, 100000.0));
        return Math.floor(final * 100) / 100;
    }
}
