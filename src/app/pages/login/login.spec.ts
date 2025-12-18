import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('Login', () => {
    let component: Login;
    let fixture: ComponentFixture<Login>;
    let authServiceSpy: jasmine.SpyObj<AuthService>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        const authSpy = jasmine.createSpyObj('AuthService', ['login']);
        const rSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [Login, ReactiveFormsModule, NoopAnimationsModule],
            providers: [
                { provide: AuthService, useValue: authSpy },
                { provide: Router, useValue: rSpy },
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        }).compileComponents();

        authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
        routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        fixture = TestBed.createComponent(Login);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should validate form fields', () => {
        const emailControl = component.loginForm.get('email');
        const passwordControl = component.loginForm.get('password');

        emailControl?.setValue('');
        passwordControl?.setValue('');

        expect(emailControl?.valid).toBeFalse();
        expect(passwordControl?.valid).toBeFalse();
    });

    it('should call authService.login on valid submit', () => {
        const mockResponse = {
            accessToken: 'token',
            refreshToken: 'ref',
            userId: '1',
            username: 'user',
            email: 'test@example.com',
            balance: 1000
        };
        authServiceSpy.login.and.returnValue(of(mockResponse));

        component.loginForm.patchValue({ email: 'test@example.com', password: 'password' });
        component.onSubmit();

        expect(authServiceSpy.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' });
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should handle login error', () => {
        authServiceSpy.login.and.returnValue(throwError(() => new Error('Login failed')));

        component.loginForm.patchValue({ email: 'test@example.com', password: 'password' });
        component.onSubmit();

        expect(component.error).toBe('Login fallito. Controlla le credenziali.');
        expect(component.loading).toBeFalse();
    });
});
