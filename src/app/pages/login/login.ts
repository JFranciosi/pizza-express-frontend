import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpContext } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { Footer } from '../../components/footer/footer';
import { SKIP_ERROR_TOAST } from '../../data/http-context.tokens';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        CardModule,
        InputTextModule,
        ButtonModule,
        PasswordModule,
        CheckboxModule,
        FloatLabelModule,
        RouterLink,
        ToastModule,
        Footer
    ],
    providers: [MessageService],
    templateUrl: './login.html',
    styleUrl: './login.css'
})
export class Login implements OnInit {
    loginForm: FormGroup;
    loading = false;
    error = '';
    rememberMe = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private messageService: MessageService
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required]
        });
    }

    ngOnInit() {
        const savedEmail = localStorage.getItem('saved_email');
        const savedPassword = localStorage.getItem('saved_password');

        if (savedEmail) {
            const patchData: any = { email: savedEmail };

            if (savedPassword) {
                try {
                    patchData.password = atob(savedPassword);
                } catch (e) {
                    console.error('Error decoding saved password');
                }
            }

            this.loginForm.patchValue(patchData);
            this.rememberMe = true;
        }
    }

    onSubmit() {
        if (this.loginForm.valid) {
            this.loading = true;
            this.error = '';

            const { email, password } = this.loginForm.value;
            if (this.rememberMe) {
                localStorage.setItem('saved_email', email);
                localStorage.setItem('saved_password', btoa(password));
            } else {
                localStorage.removeItem('saved_email');
                localStorage.removeItem('saved_password');
            }

            const context = new HttpContext().set(SKIP_ERROR_TOAST, true);

            this.authService.login(this.loginForm.value, context).subscribe({
                next: (response) => {
                    console.log('Login successful', response);
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Login successful' });
                    this.loading = false;
                    setTimeout(() => {
                        this.router.navigate(['/home']);
                    }, 1000);
                },
                error: (err) => {
                    console.error('Login error', err);
                    this.error = 'Login failed.';
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Login failed' });
                    this.loading = false;
                }
            });
        } else {
            this.loginForm.markAllAsTouched();
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please fill in all required fields' });
        }
    }
}
