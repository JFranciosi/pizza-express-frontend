import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerBets } from './player-bets';

describe('PlayerBetsComponent', () => {
    let component: PlayerBets;
    let fixture: ComponentFixture<PlayerBets>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PlayerBets]
        })
            .compileComponents();

        fixture = TestBed.createComponent(PlayerBets);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
