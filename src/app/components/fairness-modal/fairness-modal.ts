import { Component, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { GameSocketService } from '../../services/game-socket.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-fairness-modal',
    standalone: true,
    imports: [CommonModule, DialogModule, ButtonModule],
    templateUrl: './fairness-modal.html',
    styleUrl: './fairness-modal.css'
})
export class FairnessModalComponent {
    visible: boolean = false;

    currentHash: Signal<string>;
    lastSecret: Signal<string>;

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
}
