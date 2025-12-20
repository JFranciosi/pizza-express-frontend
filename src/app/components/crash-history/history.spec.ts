import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrashHistoryComponent } from './history';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('CrashHistoryComponent', () => {
    let component: CrashHistoryComponent;
    let fixture: ComponentFixture<CrashHistoryComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CrashHistoryComponent, HttpClientTestingModule]
        })
            .compileComponents();

        fixture = TestBed.createComponent(CrashHistoryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
