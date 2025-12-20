
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../services/auth.service';
import { MessageService } from 'primeng/api';

import { Router } from '@angular/router';

import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-settings-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, ButtonModule, InputTextModule, PasswordModule, TooltipModule],
    providers: [MessageService],
    templateUrl: './settings-modal.html',
    styleUrls: ['./settings-modal.css']
})
export class SettingsModalComponent implements OnInit {
    visible: boolean = false;
    user: any = null;

    oldPassword: string = '';
    newPassword: string = '';
    confirmPassword: string = '';

    loading: boolean = false;
    error: string = '';
    success: string = '';

    constructor(private authService: AuthService, private router: Router) { }

    ngOnInit() {
        this.authService.user$.subscribe(user => {
            this.user = user;
        });
    }

    show() {
        this.visible = true;
        this.resetForm();
    }

    openLegal() {
        this.visible = false;
        this.router.navigate(['/legal']);
    }

    resetForm() {
        this.oldPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.error = '';
        this.success = '';
        this.loading = false;
    }

    changePassword() {
        if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
            this.error = 'All fields are required';
            return;
        }

        if (this.newPassword !== this.confirmPassword) {
            this.error = 'New passwords do not match';
            return;
        }

        this.loading = true;
        this.error = '';
        this.success = '';

        this.authService.changePassword(this.oldPassword, this.newPassword).subscribe({
            next: () => {
                this.success = 'Password changed successfully';
                this.loading = false;
                this.oldPassword = '';
                this.newPassword = '';
                this.confirmPassword = '';
            },
            error: (err) => {
                this.error = err.error?.error || 'Failed to change password';
                this.loading = false;
            }
        });
    }
}
