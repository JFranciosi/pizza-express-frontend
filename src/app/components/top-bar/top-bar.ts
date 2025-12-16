import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-top-bar',
    standalone: true,
    imports: [CommonModule, ButtonModule],
    templateUrl: './top-bar.html',
    styleUrl: './top-bar.css'
})
export class TopBarComponent {
    @Output() toggleChat = new EventEmitter<void>();
    user: any | null = null;

    constructor(private authService: AuthService, private router: Router) {
        this.authService.user$.subscribe(user => {
            this.user = user;
        });
    }

    onLogout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    onToggleChat() {
        this.toggleChat.emit();
    }
}
