import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-bet-controls',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputNumberModule],
    templateUrl: './bet-controls.html',
    styleUrl: './bet-controls.css'
})
export class BetControlsComponent {
    betAmount: number = 5.00;
    autoCashout: number | null = 2.00;

    constructor(private authService: AuthService) {
    }

    setBet(amount: number) {
        this.betAmount = amount;
    }

    placeBet() {
        console.log('Scommessa piazzata:', this.betAmount, 'AutoCashout:', this.autoCashout);
    }
}
