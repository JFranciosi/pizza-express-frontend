import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('accessToken');

    // Exclude auth endpoints from requiring a token
    if (req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/game/history')) {
        return next(req);
    }

    if (token) {
        const cloned = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(cloned);
    }

    return next(req);
};
