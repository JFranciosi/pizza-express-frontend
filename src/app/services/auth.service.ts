import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoginRequest, AuthResponse, RegisterRequest } from '../models/auth.models';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:8080/auth';
    private userSubject = new BehaviorSubject<any | null>(this.getUserFromStorage());
    public user$ = this.userSubject.asObservable();

    constructor(private http: HttpClient) { }

    login(request: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
            tap(response => {
                this.saveSession(response);
            })
        );
    }

    register(request: RegisterRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
            tap(response => {
                this.saveSession(response);
            })
        );
    }

    private saveSession(response: AuthResponse): void {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        const user = {
            id: response.userId,
            username: response.username,
            email: response.email,
            balance: response.balance
        };
        localStorage.setItem('user_data', JSON.stringify(user));
        this.userSubject.next(user);
    }

    getToken(): string | null {
        return localStorage.getItem('accessToken');
    }

    private getUserFromStorage(): any | null {
        const userStr = localStorage.getItem('user_data');
        return userStr ? JSON.parse(userStr) : null;
    }

    getUser(): any | null {
        return this.userSubject.value;
    }

    logout(): void {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user_data');
        this.userSubject.next(null);
    }

    updateBalance(newBalance: number): void {
        const user = this.getUser();
        if (user) {
            user.balance = newBalance;
            localStorage.setItem('user_data', JSON.stringify(user));
            this.userSubject.next({ ...user });
        }
    }
}
