import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs/operators';

const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';
const CSRF_STORAGE_KEY = 'XSRF-TOKEN';

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
    let requestToForward = req;
    const storedToken = localStorage.getItem(CSRF_STORAGE_KEY);

    if (storedToken && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        requestToForward = req.clone({
            headers: req.headers.set(CSRF_HEADER_NAME, storedToken)
        });
    }

    return next(requestToForward).pipe(
        tap({
            next: (event) => {
                if (event.type === 4) {
                    const tokenFromHeader = event.headers.get(CSRF_HEADER_NAME);
                    if (tokenFromHeader) {
                        localStorage.setItem(CSRF_STORAGE_KEY, tokenFromHeader);
                    }
                }
            }
        })
    );
};
