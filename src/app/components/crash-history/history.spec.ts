import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrashHistoryComponent } from './history';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('CrashHistoryComponent', () => {
    let component: CrashHistoryComponent;
    let fixture: ComponentFixture<CrashHistoryComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CrashHistoryComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting()
            ]
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
