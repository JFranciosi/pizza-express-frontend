import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { GameApiService } from '../../services/game-api.service';

@Component({
    selector: 'app-history-modal',
    standalone: true,
    imports: [CommonModule, DialogModule, TableModule, ButtonModule],
    template: `
        <p-dialog header="Full Crash History" [(visible)]="visible" [modal]="true" [style]="{width: '50vw'}" [draggable]="false" [resizable]="false" appendTo="body">
            <div class="history-table-container">
                <p-table [value]="history" [scrollable]="true" scrollHeight="400px" styleClass="p-datatable-sm">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Time (Ago)</th>
                            <th>Multiplier</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-item let-i="rowIndex">
                        <tr [class.high-win]="item >= 10">
                            <td>{{ i + 1 }} rounds ago</td>
                            <td class="multiplier-val" [class.high]="item >= 10" [class.medium]="item >= 2 && item < 10" [class.low]="item < 2">
                                {{ item.toFixed(2) }}x
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="2" class="text-center p-4">No history records found.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>

        </p-dialog>
    `,
    styles: [`
        .multiplier-val {
            font-weight: bold;
        }
        .high { color: #e31b23; text-shadow: 0 0 10px rgba(227, 27, 35, 0.4); }
        .medium { color: #ffffff; }
        .low { color: #4caf50; }
    `]
})
export class HistoryModalComponent {
    visible: boolean = false;
    history: number[] = [];

    constructor(private gameApi: GameApiService, private cdr: ChangeDetectorRef) { }

    show() {
        this.visible = true;
        this.loadHistory();
        this.cdr.detectChanges();
    }

    loadHistory() {
        this.gameApi.getFullHistory().subscribe({
            next: (data) => {
                console.log('History loaded:', data);
                this.history = data || [];
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load history:', err);
                this.history = [];
                this.cdr.detectChanges();
            }
        });
    }
}
