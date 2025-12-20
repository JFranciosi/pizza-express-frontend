import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BetPanelComponent } from '../bet-panel/bet-panel'; // Ensure path is correct

@Component({
    selector: 'app-bet-controls',
    standalone: true,
    imports: [CommonModule, BetPanelComponent],
    templateUrl: './bet-controls.html',
    styleUrl: './bet-controls.css'
})
export class BetControlsComponent {

}
