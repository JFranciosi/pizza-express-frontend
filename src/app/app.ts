import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';

import { RoundDetailsModal } from './components/round-details-modal/round-details-modal';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RoundDetailsModal, ToastModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('pizza-express-frontend');

  constructor(private authService: AuthService) {
    this.authService.verifySession().subscribe();
  }
}
