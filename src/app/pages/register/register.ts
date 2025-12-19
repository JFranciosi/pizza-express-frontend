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
            password: ['', Validators.required]
        });
    }

    onSubmit() {
        if (this.registerForm.valid) {
            this.loading = true;
            this.error = '';

            this.authService.register(this.registerForm.value).subscribe({
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
                    this.error = 'Registrazione fallita. Riprova.';
                    this.messageService.add({ severity: 'error', summary: 'Errore', detail: 'Impossibile completare la registrazione' });
                }
            });
        } else {
            this.registerForm.markAllAsTouched();
            this.messageService.add({ severity: 'warn', summary: 'Attenzione', detail: 'Compila tutti i campi richiesti' });
        }
    }
}
