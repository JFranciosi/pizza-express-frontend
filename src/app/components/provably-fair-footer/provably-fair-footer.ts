import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-provably-fair-footer',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './provably-fair-footer.html',
    styleUrl: './provably-fair-footer.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProvablyFairFooter {

}
