import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameSocketService, HistoryItem } from '../../services/game-socket.service';
import { HistoryModalComponent } from '../history-modal/history-modal';
import { FairnessService } from '../../services/fairness.service';

@Component({
    selector: 'app-crash-history',
    standalone: true,
    imports: [CommonModule, HistoryModalComponent],
    templateUrl: './history.html',
    styleUrl: './history.css'
})
export class CrashHistoryComponent implements OnInit {
    @ViewChild(HistoryModalComponent) modal!: HistoryModalComponent;
    history: HistoryItem[] = [];

    constructor(public gameSocket: GameSocketService, private fairnessService: FairnessService) { }

    ngOnInit() {
        this.gameSocket.history$.subscribe(h => {
            this.history = [...h];
        });
    }

    openFullHistory() {
        this.modal.show();
    }

    openDetails(item: HistoryItem) {
        if (item.secret) {
            this.fairnessService.openRoundDetails({ secret: item.secret, multiplier: item.multiplier });
        }
    }
}
