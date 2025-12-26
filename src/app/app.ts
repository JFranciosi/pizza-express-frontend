import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { RoundDetailsModalComponent } from './components/round-details-modal/round-details-modal';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RoundDetailsModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('pizza-express-frontend');
}
