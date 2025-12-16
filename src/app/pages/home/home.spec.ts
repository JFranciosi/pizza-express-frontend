import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Home } from './home';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

describe('Home', () => {
    let component: Home;
    let fixture: ComponentFixture<Home>;
    let authServiceSpy: jasmine.SpyObj<AuthService>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        const authSpy = jasmine.createSpyObj('AuthService', ['logout']);
        const rSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [Home, CardModule, ButtonModule],
            providers: [
                { provide: AuthService, useValue: authSpy },
                { provide: Router, useValue: rSpy }
            ]
        }).compileComponents();

        authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
        routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        fixture = TestBed.createComponent(Home);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call authService.logout and navigate to login on logout', () => {
        component.logout();
        expect(authServiceSpy.logout).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
});
