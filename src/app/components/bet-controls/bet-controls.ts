import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BetPanel } from '../bet-panel/bet-panel';

@Component({
    selector: 'app-bet-controls',
    standalone: true,
    imports: [CommonModule, BetPanel],
    templateUrl: './bet-controls.html',
    styleUrl: './bet-controls.css'
})
export class BetControls {
    @Input() multiplier: number = 1.0;
}
