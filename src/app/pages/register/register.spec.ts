import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Register } from './register';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('Register', () => {
    let component: Register;
    let fixture: ComponentFixture<Register>;
    let authServiceSpy: jasmine.SpyObj<AuthService>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        const authSpy = jasmine.createSpyObj('AuthService', ['register']);
        const rSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [Register, ReactiveFormsModule, NoopAnimationsModule],
            providers: [
                { provide: AuthService, useValue: authSpy },
                { provide: Router, useValue: rSpy },
                { provide: ActivatedRoute, useValue: {} },
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        }).compileComponents();

        authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
        routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        fixture = TestBed.createComponent(Register);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should validate form fields', () => {
        const usernameControl = component.registerForm.get('username');
        const emailControl = component.registerForm.get('email');
        const passwordControl = component.registerForm.get('password');

        usernameControl?.setValue('');
        emailControl?.setValue('');
        passwordControl?.setValue('');

        expect(usernameControl?.valid).toBeFalse();
        expect(emailControl?.valid).toBeFalse();
        expect(passwordControl?.valid).toBeFalse();
    });

    it('should call authService.register on valid submit', () => {
        const mockResponse = { accessToken: 'token', refreshToken: 'ref', userId: '1', username: 'user' };
        authServiceSpy.register.and.returnValue(of(mockResponse));

        component.registerForm.patchValue({ username: 'testuser', email: 'test@example.com', password: 'password' });
        component.onSubmit();

        expect(authServiceSpy.register).toHaveBeenCalledWith({ username: 'testuser', email: 'test@example.com', password: 'password' });
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should handle registration error', () => {
        authServiceSpy.register.and.returnValue(throwError(() => new Error('Registration failed')));

        component.registerForm.patchValue({ username: 'testuser', email: 'test@example.com', password: 'password' });
        component.onSubmit();

        expect(component.error).toBe('Registrazione fallita. Riprova.');
        expect(component.loading).toBeFalse();
    });
});
