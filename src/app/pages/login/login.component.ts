import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        CardModule,
        InputTextModule,
        ButtonModule,
        PasswordModule,
        FloatLabelModule,
        RouterLink
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent {
    loginForm: FormGroup;
    loading = false;
    error = '';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required]
        });
    }

    onSubmit() {
        if (this.loginForm.valid) {
            this.loading = true;
            this.error = '';

            const { email, password } = this.loginForm.value;

            this.authService.login({ email, password }).subscribe({
                next: (response) => {
                    console.log('Login successful', response);
                    this.loading = false;
                    // Navigate to dashboard or home
                    this.router.navigate(['/home']);
                },
                error: (err) => {
                    console.error('Login error', err);
                    this.loading = false;
                    this.error = 'Login fallito. Controlla le credenziali.';
                }
            });
        } else {
            this.loginForm.markAllAsTouched();
        }
    }
}
