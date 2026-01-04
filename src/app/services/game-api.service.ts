import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { HistoryItem } from './game-socket.service';

export interface TopBet {
    id: string;
    userId: string;
    username: string;
    avatarUrl?: string;
    betAmount: number;
    profit: number;
    multiplier: number;
    timestamp: number;
}


@Injectable({
    providedIn: 'root'
})
export class GameApiService {
    private readonly BASE_URL = environment.apiUrl;
    private readonly API_URL = `${this.BASE_URL}/game`;

    constructor(private http: HttpClient) { }

    // ...

    getFullHistory(): Observable<HistoryItem[]> {
        return this.http.get<string[]>(`${this.API_URL}/history?limit=200`).pipe(
            map(list => (list || []).map(s => {
                const p = s.split(':');
                if (p.length > 1) {
                    return { multiplier: parseFloat(p[0]), secret: p[1] };
                }
                return { multiplier: parseFloat(p[0]) };
            }))
        );
    }

    placeBet(amount: number, autoCashout: number, index: number = 0): Observable<any> {
        const nonce = crypto.randomUUID();
        return this.http.post(`${this.BASE_URL}/bet/place`, { amount, autoCashout, index, nonce });
    }

    cancelBet(index: number = 0): Observable<any> {
        return this.http.post(`${this.BASE_URL}/bet/cancel?index=${index}`, {});
    }

    cashOut(index: number = 0): Observable<any> {
        return this.http.post(`${this.BASE_URL}/bet/cashout?index=${index}`, {});
    }

    getTopBets(type: 'profit' | 'multiplier'): Observable<TopBet[]> {
        return this.http.get<TopBet[]>(`${this.BASE_URL}/bet/top?type=${type}`);
    }

    getFairness(): Observable<{ activeCommitment: string, remainingGames: number }> {
        return this.http.get<any>(`${this.API_URL}/fairness`);
    }
}
