import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('accessToken');

    if (req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/game/history')) {
        return next(req);
    }

    if (token) {
        const cloned = req.clone({
            withCredentials: true,
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(cloned);
    }

    const authReq = req.clone({
        withCredentials: true
    });
    return next(authReq);
};
