import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { Footer } from '../../components/footer/footer';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, CardModule, ToastModule, Footer],
    templateUrl: './forgot-password.html',
    styleUrls: ['./forgot-password.css'],
    providers: [MessageService]
})
export class ForgotPassword {
    forgotForm: FormGroup;
    loading = false;
    submitted = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private messageService: MessageService,
        private router: Router
    ) {
        this.forgotForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]]
        });
    }

    onSubmit() {
        if (this.forgotForm.invalid) {
            this.forgotForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        const email = this.forgotForm.get('email')?.value;

        this.authService.forgotPassword(email).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Reset link sent to your email.' });
                this.submitted = true;
                this.loading = false;
            },
            error: (err) => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'If the email exists, a reset link has been sent.' });
                this.submitted = true;
                this.loading = false;
            }
        });
    }
}
