import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BetControls } from './bet-controls';

describe('BetControlsComponent', () => {
    let component: BetControls;
    let fixture: ComponentFixture<BetControls>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [BetControls]
        })
            .compileComponents();

        fixture = TestBed.createComponent(BetControls);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
