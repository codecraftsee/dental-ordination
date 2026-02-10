import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError(error => {
      if (
        error.status === 401 &&
        req.url.startsWith(environment.apiUrl) &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/refresh')
      ) {
        return authService.refreshToken().pipe(
          switchMap(tokenResponse => {
            if (!tokenResponse) {
              return throwError(() => error);
            }
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${tokenResponse.accessToken}` },
            });
            return next(retryReq);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
