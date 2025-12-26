import { Component, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { GameSocketService } from '../../services/game-socket.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-fairness-modal',
    standalone: true,
    imports: [CommonModule, DialogModule, ButtonModule, FormsModule],
    templateUrl: './fairness-modal.html',
    styleUrl: './fairness-modal.css'
})
export class FairnessModalComponent {
    visible: boolean = false;

    currentHash: Signal<string>;
    lastSecret: Signal<string>;

    verifySecret: string = '';
    verifyHash: string | null = null;
    verifyResult: number | null = null;
    calculationSteps: string = '';

    constructor(private gameSocket: GameSocketService) {
        this.currentHash = toSignal(this.gameSocket.currentHash$, { initialValue: '' });
        this.lastSecret = toSignal(this.gameSocket.lastSecret$, { initialValue: '' });
    }

    show() {
        this.visible = true;
    }

    copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
    }

    async verify() {
        if (!this.verifySecret) return;

        // 1. Calculate SHA256 Hash
        this.verifyHash = await this.sha256(this.verifySecret);

        // 2. Calculate Crash Point
        this.verifyResult = this.calculateCrashPoint(this.verifySecret);
    }

    private async sha256(message: string): Promise<string> {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    private calculateCrashPoint(hash: string): number {
        // Implementation matching backend ProvablyFairService.java
        // 1. Take first 13 chars (52 bits)
        const hex = hash.substring(0, 13);
        const h = parseInt(hex, 16);
        const e = Math.pow(2, 52);

        const x = h / e;
        const multiplier = 0.99 / (1.0 - x);

        const final = Math.max(1.00, Math.min(multiplier, 100000.0));
        return Math.floor(final * 100) / 100;
    }
}
