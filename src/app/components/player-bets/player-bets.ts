import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-player-bets',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './player-bets.html',
    styleUrl: './player-bets.css'
})
export class PlayerBetsComponent implements OnInit {
    bets: any[] = [];

    ngOnInit() {
        this.bets = [
            { user: 'Mario Rossi', amount: 5.00, multiplier: null, profit: null },
            { user: 'Luigi Verdi', amount: 10.00, multiplier: 2.50, profit: 25.00 },
            { user: 'Giulia Bianchi', amount: 2.00, multiplier: null, profit: null },
            { user: 'PizzaLover99', amount: 100.00, multiplier: 1.10, profit: 110.00 }
        ];
    }
}
