import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs/operators';

const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
    let requestToForward = req;

    // Read token from cookie
    const token = document.cookie.split('; ')
        .find(row => row.startsWith(CSRF_COOKIE_NAME + '='))
        ?.split('=')[1];

    if (token && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        requestToForward = req.clone({
            headers: req.headers.set(CSRF_HEADER_NAME, decodeURIComponent(token))
        });
    }

    return next(requestToForward);
};
