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
    selector: 'app-register',
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
    templateUrl: './register.html',
    styleUrl: './register.css'
})
export class Register {
    registerForm: FormGroup;
    loading = false;
    error = '';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private messageService: MessageService
    ) {
        this.registerForm = this.fb.group({
            username: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
            confirmPassword: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });
    }

    passwordMatchValidator(g: FormGroup) {
        return g.get('password')?.value === g.get('confirmPassword')?.value
            ? null : { mismatch: true };
    }

    onSubmit() {
        if (this.registerForm.valid) {
            this.loading = true;
            this.error = '';

            const { confirmPassword, ...registerData } = this.registerForm.value;

            this.authService.register(registerData).subscribe({
                next: (response) => {
                    console.log('Registration successful', response);
                    this.messageService.add({ severity: 'success', summary: 'Successo', detail: 'Registrazione completata!' });
                    this.loading = false;
                    setTimeout(() => {
                        this.router.navigate(['/home']);
                    }, 1000);
                },
                error: (err) => {
                    console.error('Registration error', err);
                    this.loading = false;

                    let msg = err.error?.error || 'Impossibile completare la registrazione';
                    if (msg.includes('Email already in use')) msg = "L'email è già in uso.";
                    if (msg.includes('Username already in use')) msg = "Lo username è già in uso.";

                    this.error = 'Registrazione fallita.';
                    this.messageService.add({ severity: 'error', summary: 'Errore', detail: msg });
                }
            });
        } else {
            this.registerForm.markAllAsTouched();
            this.messageService.add({ severity: 'warn', summary: 'Attenzione', detail: 'Compila tutti i campi richiesti' });
        }
    }
}
