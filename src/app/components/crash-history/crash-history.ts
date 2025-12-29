import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameSocketService, HistoryItem } from '../../services/game-socket.service';
import { HistoryModal } from '../history-modal/history-modal';
import { FairnessService } from '../../services/fairness.service';

@Component({
    selector: 'app-crash-history',
    standalone: true,
    imports: [CommonModule, HistoryModal],
    templateUrl: './crash-history.html',
    styleUrl: './crash-history.css'
})
export class CrashHistory {
    @ViewChild(HistoryModal) modal!: HistoryModal;
    constructor(public gameSocket: GameSocketService, private fairnessService: FairnessService) { }

    openFullHistory() {
        this.modal.show();
    }

    openDetails(item: HistoryItem) {
        if (item.secret) {
            this.fairnessService.openRoundDetails({ secret: item.secret, multiplier: item.multiplier });
        }
    }
}
