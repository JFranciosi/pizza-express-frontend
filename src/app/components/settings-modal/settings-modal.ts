
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

    // Password fields
    oldPassword: string = '';
    newPassword: string = '';
    confirmPassword: string = '';

    // Profile Editing
    isEditingEmail: boolean = false;
    editEmail: string = '';
    confirmEmailPassword: string = '';
    emailError: string = '';

    loading: boolean = false;
    error: string = '';
    success: string = '';

    constructor(private authService: AuthService, private router: Router) { }

    ngOnInit() {
        this.authService.user$.subscribe(user => {
            this.user = user;
            if (user) {
                this.editEmail = user.email;
            }
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
        this.emailError = '';
        this.isEditingEmail = false;
        this.confirmEmailPassword = '';
        if (this.user) {
            this.editEmail = this.user.email;
        }
        this.loading = false;
    }

    toggleEditEmail() {
        this.isEditingEmail = !this.isEditingEmail;
        this.confirmEmailPassword = ''; // Reset password input
        if (!this.isEditingEmail) this.editEmail = this.user.email;
        else this.emailError = '';
    }

    saveEmail() {
        // Basic validation
        if (!this.editEmail) {
            this.emailError = 'Email cannot be empty';
            return;
        }
        if (!this.confirmEmailPassword) {
            this.emailError = 'Confirm with password required';
            return;
        }

        // Call API
        this.authService.updateEmail(this.editEmail, this.confirmEmailPassword).subscribe({
            next: () => {
                this.isEditingEmail = false;
                this.success = 'Email updated successfully';
                this.confirmEmailPassword = '';
                setTimeout(() => this.success = '', 3000);
            },
            error: (err) => {
                const msg = err.error?.message || err.error?.error || 'Update failed';
                this.emailError = msg;
            }
        });
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
