import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CsrfService } from '../services/csrf.service';

export const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
    let requestToForward = req;

    const csrfService = inject(CsrfService);
    const token = csrfService.getToken() || document.cookie.split('; ')
        .find(row => row.startsWith(CSRF_COOKIE_NAME + '='))
        ?.split('=')[1];

    if (token && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        requestToForward = req.clone({
            headers: req.headers.set(CSRF_HEADER_NAME, decodeURIComponent(token))
        });
    }

    return next(requestToForward);
};
