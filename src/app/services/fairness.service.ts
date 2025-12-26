import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface VerifyData {
    secret: string;
    multiplier?: number;
}

@Injectable({
    providedIn: 'root'
})
export class FairnessService {
    private openModalSource = new Subject<VerifyData | null>();
    public openModal$ = this.openModalSource.asObservable();

    private openRoundDetailsSource = new Subject<VerifyData>();
    public openRoundDetails$ = this.openRoundDetailsSource.asObservable();

    open(data: VerifyData | null = null) {
        this.openModalSource.next(data);
    }

    openRoundDetails(data: VerifyData) {
        this.openRoundDetailsSource.next(data);
    }
}
