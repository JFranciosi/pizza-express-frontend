import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrashHistory } from './crash-history';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('CrashHistory', () => {
    let component: CrashHistory;
    let fixture: ComponentFixture<CrashHistory>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CrashHistory],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(CrashHistory);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
