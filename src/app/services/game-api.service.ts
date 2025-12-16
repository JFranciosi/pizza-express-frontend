import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class GameApiService {
    private readonly BASE_URL = 'http://localhost:8080';
    private readonly API_URL = `${this.BASE_URL}/game`;

    constructor(private http: HttpClient) { }

    getFullHistory(): Observable<number[]> {
        return this.http.get<string[]>(`${this.API_URL}/history`).pipe(
            map(list => (list || []).map(item => parseFloat(item)))
        );
    }

    placeBet(amount: number): Observable<any> {
        return this.http.post(`${this.BASE_URL}/bet/place`, { amount });
    }

    cashOut(): Observable<any> {
        return this.http.post(`${this.BASE_URL}/bet/cashout`, {});
    }
}
