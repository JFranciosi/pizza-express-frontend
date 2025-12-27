import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../services/auth.service';
import { MessageService } from 'primeng/api';


import { Router } from '@angular/router';

import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-settings-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, ButtonModule, InputTextModule, PasswordModule, TooltipModule, ToastModule],
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
    isEditingEmail: boolean = false;
    editEmail: string = '';
    confirmEmailPassword: string = '';
    emailError: string = '';
    loading: boolean = false;
    error: string = '';
    success: string = '';

    editAvatar: string = '';
    isEditingAvatar: boolean = false;

    @ViewChild('fileInput') fileInput!: ElementRef;

    triggerFileInput() {
        this.fileInput?.nativeElement.click();
    }

    constructor(private authService: AuthService, private router: Router, private messageService: MessageService) { }

    ngOnInit() {
        this.authService.user$.subscribe(user => {
            this.user = user;
            if (user) {
                this.editEmail = user.email;
                this.editAvatar = user.avatarUrl || '';
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
        this.isEditingAvatar = false;
        this.confirmEmailPassword = '';
        if (this.user) {
            this.editEmail = this.user.email;
            this.editAvatar = this.user.avatarUrl || '';
        }
        this.pendingAvatarFile = null;
        this.previewAvatarUrl = null;
        this.loading = false;
    }

    toggleEditEmail() {
        this.isEditingEmail = !this.isEditingEmail;
        this.confirmEmailPassword = '';
        if (!this.isEditingEmail) this.editEmail = this.user.email;
        else this.emailError = '';
    }

    toggleEditAvatar() {
        this.isEditingAvatar = !this.isEditingAvatar;
        if (!this.isEditingAvatar) {
            this.editAvatar = this.user.avatarUrl || '';
        }
    }


    pendingAvatarFile: File | null = null;
    previewAvatarUrl: string | null = null;

    onFileSelected(event: any) {
        const file: File = event.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB Check
                this.messageService.add({ severity: 'error', summary: 'Errore', detail: 'Immagine troppo grande (Max 2MB)' });
                return;
            }

            this.pendingAvatarFile = file;

            // Create preview
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.previewAvatarUrl = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    cancelAvatarPreview() {
        this.pendingAvatarFile = null;
        this.previewAvatarUrl = null;
    }

    uploadAvatar() {
        if (!this.pendingAvatarFile) return;

        this.loading = true;
        this.isEditingAvatar = true;
        const formData = new FormData();
        formData.append('file', this.pendingAvatarFile);

        this.authService.updateAvatar(formData).subscribe({
            next: (res: any) => {
                this.loading = false;
                this.isEditingAvatar = false;
                this.pendingAvatarFile = null;
                this.previewAvatarUrl = null;
                this.messageService.add({ severity: 'success', summary: 'Successo', detail: 'Avatar aggiornato' });
            },
            error: (err) => {
                this.loading = false;
                this.isEditingAvatar = false;
                this.messageService.add({ severity: 'error', summary: 'Errore', detail: 'Upload failed: ' + (err.error?.message || err.statusText) });
            }
        });
    }

    getAvatarUrl(url: string): string {
        if (this.previewAvatarUrl) return this.previewAvatarUrl;
        if (!url) return '/assets/default-avatar.png';
        return url;
    }

    onAvatarError(event: any) {
        event.target.src = '/assets/default-avatar.png';
    }

    saveEmail() {
        if (!this.editEmail) {
            this.emailError = 'Email cannot be empty';
            return;
        }
        if (!this.confirmEmailPassword) {
            this.emailError = 'Confirm with password required';
            return;
        }

        this.authService.updateEmail(this.editEmail, this.confirmEmailPassword).subscribe({
            next: () => {
                this.isEditingEmail = false;
                this.messageService.add({ severity: 'success', summary: 'Successo', detail: 'Email aggiornata con successo' });
                this.confirmEmailPassword = '';
            },
            error: (err) => {
                const msg = err.error?.error || 'Update failed';
                this.handleError(msg, 'email');
            }
        });
    }

    changePassword() {
        if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
            this.messageService.add({ severity: 'warn', summary: 'Attenzione', detail: 'Tutti i campi sono obbligatori' });
            return;
        }

        if (this.newPassword !== this.confirmPassword) {
            this.messageService.add({ severity: 'error', summary: 'Errore', detail: 'Le nuove password non coincidono' });
            return;
        }

        this.loading = true;
        this.error = '';
        this.success = '';

        this.authService.changePassword(this.oldPassword, this.newPassword).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Successo', detail: 'Password modificata con successo' });
                this.loading = false;
                this.oldPassword = '';
                this.newPassword = '';
                this.confirmPassword = '';
            },
            error: (err) => {
                const msg = err.error?.error || 'Failed to change password';
                this.handleError(msg, 'password');
                this.loading = false;
            }
        });
    }

    private handleError(msg: string, context: 'email' | 'password') {
        let detail = msg;
        if (msg.includes('Email already in use')) detail = "L'email è già associata a un altro account.";
        if (msg.includes('Invalid password') || msg.includes('Incorrect old password')) detail = "La password attuale non è corretta.";
        if (msg.includes('User not found')) detail = "Utente non trovato.";

        this.messageService.add({ severity: 'error', summary: 'Errore', detail: detail });

        if (context === 'email') {
            this.emailError = detail;
        }
    }
}
