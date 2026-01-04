import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.verifySession().pipe(
        map(isValid => {
            if (isValid) {
                return true;
            }
            return router.createUrlTree(['/login']);
        })
    );
};
