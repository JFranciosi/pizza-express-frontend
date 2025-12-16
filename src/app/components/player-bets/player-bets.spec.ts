import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerBetsComponent } from './player-bets';

describe('PlayerBetsComponent', () => {
    let component: PlayerBetsComponent;
    let fixture: ComponentFixture<PlayerBetsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PlayerBetsComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(PlayerBetsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
