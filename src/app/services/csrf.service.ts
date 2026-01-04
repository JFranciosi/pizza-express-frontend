import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class CsrfService {
    private token: string | null = null;

    getToken(): string | null {
        return this.token;
    }

    setToken(token: string): void {
        this.token = token;
    }
}
