import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameSocketService } from '../../services/game-socket.service';
import { HistoryModalComponent } from '../history-modal/history-modal';

@Component({
    selector: 'app-crash-history',
    standalone: true,
    imports: [CommonModule, HistoryModalComponent],
    templateUrl: './history.html',
    styleUrl: './history.css'
})
export class CrashHistoryComponent implements OnInit {
    @ViewChild(HistoryModalComponent) modal!: HistoryModalComponent;
    history: number[] = [];

    constructor(public gameSocket: GameSocketService) { }

    ngOnInit() {
        this.gameSocket.history$.subscribe(h => {
            // Reverse so we display [Oldest ... Newest] [+]
            // Also take only what fits? No, user wanted 50.
            this.history = [...h].reverse();
        });
    }

    openFullHistory() {
        this.modal.show();
    }
}
