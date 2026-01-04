import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { LoginRequest, AuthResponse, RegisterRequest } from '../models/auth.models';

import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = `${environment.apiUrl}/auth`;
    private userSubject = new BehaviorSubject<any | null>(this.getUserFromStorage());
    public user$ = this.userSubject.asObservable();
    private authenticated = false;

    constructor(private http: HttpClient) { }

    login(request: LoginRequest, context?: HttpContext): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request, { context }).pipe(
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
        const user = {
            id: response.userId,
            username: response.username,
            email: response.email,
            avatarUrl: response.avatarUrl
        };
        localStorage.setItem('user_data', JSON.stringify(user));

        this.userSubject.next({
            ...user,
            balance: response.balance
        });
        this.authenticated = true;
    }

    getToken(): string | null {
        return null;
    }

    private getUserFromStorage(): any | null {
        const userStr = localStorage.getItem('user_data');
        if (userStr) {
            const user = JSON.parse(userStr);
            user.balance = undefined;
            return user;
        }
        return null;
    }

    getUser(): any | null {
        return this.userSubject.value;
    }

    logout(skipServerCall = false): void {
        if (!skipServerCall) {
            this.http.post(`${this.apiUrl}/logout`, {}).subscribe();
        }
        localStorage.removeItem('user_data');
        this.userSubject.next(null);
        this.authenticated = false;
    }

    updateBalance(newBalance: number): void {
        const user = this.getUser();
        if (user) {
            user.balance = newBalance;
            this.userSubject.next({ ...user });
        }
    }

    changePassword(oldPass: string, newPass: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/change-password`, { oldPass, newPass });
    }

    private persistUserToStorage(user: any) {
        const { balance, ...safeUser } = user;
        localStorage.setItem('user_data', JSON.stringify(safeUser));
    }

    updateEmail(email: string, password: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/update-profile`, { email, password }).pipe(
            tap((response: any) => {
                const user = this.getUser();
                if (user) {
                    user.email = email;
                    this.persistUserToStorage(user);
                    this.userSubject.next({ ...user });
                }
            })
        );
    }

    updateAvatar(formData: FormData): Observable<any> {
        return this.http.post(`${this.apiUrl}/upload-avatar`, formData).pipe(
            tap((response: any) => {
                const user = this.getUser();
                if (user && response.avatarUrl) {
                    user.avatarUrl = response.avatarUrl;
                    this.persistUserToStorage(user);
                    this.userSubject.next({ ...user });
                }
            })
        );
    }

    forgotPassword(email: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/forgot-password`, { email });
    }

    resetPassword(token: string, newPassword: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/reset-password`, { token, newPassword });
    }

    refreshToken(): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, {}).pipe(
            tap(response => {
                this.saveSession(response);
            })
        );
    }

    verifySession(): Observable<boolean> {
        if (this.authenticated) {
            return of(true);
        }
        return this.http.get<any>(`${this.apiUrl}/me`).pipe(
            tap(user => {
                this.userSubject.next(user);
                this.persistUserToStorage(user);
                this.authenticated = true;
            }),
            map(() => true),
            catchError(() => {
                this.logout(true); // Server already rejected us (401), so just clear local state
                // If session is invalid, perform handshake to ensure CSRF cookie is present
                this.getCsrfToken().subscribe();
                return of(false);
            })
        );
    }

    getCsrfToken(): Observable<void> {
        return this.http.get<void>(`${this.apiUrl}/csrf`);
    }
}
