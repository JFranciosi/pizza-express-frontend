import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { FooterComponent } from '../../components/footer/footer';

@Component({
    selector: 'app-legal',
    standalone: true,
    imports: [CommonModule, ButtonModule, CardModule, FooterComponent],
    templateUrl: './legal.html',
    styleUrl: './legal.css'
})
export class LegalComponent {

    constructor(private router: Router) { }

    goHome() {
        this.router.navigate(['/home']);
    }
}
