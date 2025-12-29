import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { Footer } from '../../components/footer/footer';

@Component({
    selector: 'app-legal',
    standalone: true,
    imports: [CommonModule, ButtonModule, CardModule, Footer],
    templateUrl: './legal.html',
    styleUrl: './legal.css'
})
export class Legal {

    constructor(private router: Router) { }

    goHome() {
        this.router.navigate(['/home']);
    }
}
