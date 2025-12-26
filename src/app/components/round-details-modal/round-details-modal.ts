import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { FairnessService } from '../../services/fairness.service';

@Component({
    selector: 'app-round-details-modal',
    standalone: true,
    imports: [CommonModule, DialogModule, ButtonModule, InputTextModule, FormsModule],
    templateUrl: './round-details-modal.html',
    styleUrl: './round-details-modal.css'
})
export class RoundDetailsModalComponent {
    visible: boolean = false;

    serverSeed: string = '';
    multiplier: number | null = null;
    hash: string = '';
    hex: string = '';
    decimal: number = 0;

    constructor(private fairnessService: FairnessService, private cdr: ChangeDetectorRef) {
        this.fairnessService.openRoundDetails$.subscribe(data => {
            this.serverSeed = data.secret;
            this.multiplier = data.multiplier || 0;
            this.calculate();
            this.visible = true;
            this.cdr.detectChanges();
        });
    }

    async calculate() {
        if (!this.serverSeed) return;
        this.hash = await this.sha256(this.serverSeed);
        this.hex = this.hash.substring(0, 13);
        this.decimal = parseInt(this.hex, 16);
    }

    private async sha256(message: string): Promise<string> {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
    }
}
