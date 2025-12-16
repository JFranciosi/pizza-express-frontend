import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameSocketService } from '../../services/game-socket.service';

@Component({
    selector: 'app-crash-history',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './history.html',
    styleUrl: './history.css'
})
export class CrashHistoryComponent implements OnInit {
    history: number[] = [];

    constructor(public gameSocket: GameSocketService) { }

    ngOnInit() {
        this.history = [1.20, 5.43, 1.05, 22.10, 2.30, 1.10, 1.98, 100.00, 1.00, 3.50];
    }
}
