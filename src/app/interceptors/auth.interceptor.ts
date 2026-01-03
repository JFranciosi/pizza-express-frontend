import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);

    const authReq = req.clone({
        withCredentials: true
    });

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                // Ignore login/refresh endpoints to avoid loops if they fail
                if (!req.url.includes('/auth/login') && !req.url.includes('/auth/refresh')) {
                    router.navigate(['/login']);
                }
            }
            return throwError(() => error);
        })
    );
};
