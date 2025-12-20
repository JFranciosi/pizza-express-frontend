import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { FooterComponent } from '../../components/footer/footer';

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
        RouterLink,
        ToastModule,
        FooterComponent
    ],
    providers: [MessageService],
    templateUrl: './login.html',
    styleUrl: './login.css'
})
export class Login {
    loginForm: FormGroup;
    loading = false;
    error = '';

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

    onSubmit() {
        if (this.loginForm.valid) {
            this.loading = true;
            this.error = '';

            this.authService.login(this.loginForm.value).subscribe({
                next: (response) => {
                    console.log('Login successful', response);
                    this.messageService.add({ severity: 'success', summary: 'Successo', detail: 'Login effettuato con successo' });
                    this.loading = false;
                    setTimeout(() => {
                        this.router.navigate(['/home']);
                    }, 1000);
                },
                error: (err) => {
                    console.error('Login error', err);
                    let msg = err.error?.error || 'Credenziali non valide';

                    if (msg.includes('Invalid credentials') || msg.includes('User not found')) {
                        msg = "Email o password non corretti.";
                    }

                    this.error = 'Login fallito.';
                    this.messageService.add({ severity: 'error', summary: 'Errore', detail: msg });
                    this.loading = false;
                }
            });
        } else {
            this.loginForm.markAllAsTouched();
            this.messageService.add({ severity: 'warn', summary: 'Attenzione', detail: 'Compila tutti i campi richiesti' });
        }
    }
}
