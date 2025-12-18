import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class GameApiService {
    private readonly BASE_URL = environment.apiUrl;
    private readonly API_URL = `${this.BASE_URL}/game`;

    constructor(private http: HttpClient) { }

    getFullHistory(): Observable<number[]> {
        return this.http.get<string[]>(`${this.API_URL}/history?limit=200`).pipe(
            map(list => (list || []).map(item => parseFloat(item)))
        );
    }

    placeBet(amount: number, autoCashout: number = 0): Observable<any> {
        return this.http.post(`${this.BASE_URL}/bet/place`, { amount, autoCashout });
    }

    cancelBet(): Observable<any> {
        return this.http.post(`${this.BASE_URL}/bet/cancel`, {});
    }

    cashOut(): Observable<any> {
        return this.http.post(`${this.BASE_URL}/bet/cashout`, {});
    }
}
