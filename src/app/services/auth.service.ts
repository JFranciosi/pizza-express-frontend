import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoginRequest, AuthResponse, RegisterRequest } from '../models/auth.models';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:8080/auth';

    constructor(private http: HttpClient) { }

    login(request: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
            tap(response => {
                this.saveToken(response.accessToken);
            })
        );
    }

    register(request: RegisterRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
            tap(response => {
                this.saveToken(response.accessToken);
            })
        );
    }

    private saveToken(token: string): void {
        localStorage.setItem('accessToken', token);
    }

    getToken(): string | null {
        return localStorage.getItem('accessToken');
    }

    logout(): void {
        localStorage.removeItem('accessToken');
    }
}
