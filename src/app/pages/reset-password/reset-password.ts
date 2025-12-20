import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { FooterComponent } from '../../components/footer/footer';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, PasswordModule, CardModule, ToastModule, FooterComponent],
    templateUrl: './reset-password.html',
    styleUrls: ['./reset-password.css'],
    providers: [MessageService]
})
export class ResetPasswordComponent implements OnInit {
    resetForm: FormGroup;
    loading = false;
    token: string = '';
    submitted = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private messageService: MessageService,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.resetForm = this.fb.group({
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });
    }

    ngOnInit() {
        this.token = this.route.snapshot.queryParamMap.get('token') || '';
        if (!this.token) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid or missing token.' });
            setTimeout(() => this.router.navigate(['/login']), 2000);
        }
    }

    passwordMatchValidator(g: FormGroup) {
        return g.get('password')?.value === g.get('confirmPassword')?.value
            ? null : { mismatch: true };
    }

    onSubmit() {
        if (this.resetForm.invalid) {
            this.resetForm.markAllAsTouched();
            return;
        }

        if (!this.token) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid token.' });
            return;
        }

        this.loading = true;
        const password = this.resetForm.get('password')?.value;

        this.authService.resetPassword(this.token, password).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Password reset successful!' });
                this.submitted = true;
                this.loading = false;
                setTimeout(() => {
                    this.router.navigate(['/login']);
                }, 2000);
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'Failed to reset password.' });
                this.loading = false;
            }
        });
    }
}
