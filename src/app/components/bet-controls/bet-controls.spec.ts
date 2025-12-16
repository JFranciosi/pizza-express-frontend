import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BetControlsComponent } from './bet-controls';

describe('BetControlsComponent', () => {
    let component: BetControlsComponent;
    let fixture: ComponentFixture<BetControlsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [BetControlsComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(BetControlsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
