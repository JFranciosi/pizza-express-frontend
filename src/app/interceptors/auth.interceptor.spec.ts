import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
    let httpMock: HttpTestingController;
    let httpClient: HttpClient;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([authInterceptor])),
                provideHttpClientTesting()
            ]
        });

        httpMock = TestBed.inject(HttpTestingController);
        httpClient = TestBed.inject(HttpClient);
        localStorage.clear();
    });

    afterEach(() => {
        httpMock.verify();
        localStorage.clear();
    });

    it('should add Authorization header when token is present', () => {
        localStorage.setItem('accessToken', 'fake-token');

        httpClient.get('/test').subscribe(response => {
            expect(response).toBeTruthy();
        });

        const req = httpMock.expectOne('/test');
        expect(req.request.headers.has('Authorization')).toBeTrue();
        expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token');
        req.flush({});
    });

    it('should NOT add Authorization header when token is missing', () => {
        httpClient.get('/test').subscribe(response => {
            expect(response).toBeTruthy();
        });

        const req = httpMock.expectOne('/test');
        expect(req.request.headers.has('Authorization')).toBeFalse();
        req.flush({});
    });
});
