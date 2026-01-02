import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';
import { SKIP_ERROR_TOAST } from '../data/http-context.tokens';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const messageService = inject(MessageService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'An unexpected error occurred';

            if (error.error) {
                if (typeof error.error === 'object' && error.error.error) {
                    errorMessage = error.error.error;
                } else if (typeof error.error === 'object' && error.error.message) {
                    errorMessage = error.error.message;
                } else if (typeof error.error === 'string') {
                    errorMessage = error.error;
                }
            } else if (error.statusText) {
                errorMessage = error.statusText;
            }

            if (!req.context.get(SKIP_ERROR_TOAST)) {
                messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: errorMessage,
                    life: 5000
                });
            }

            return throwError(() => error);
        })
    );
};
