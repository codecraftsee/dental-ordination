import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Permission } from '../models/user.model';

export const permissionGuard = (requiredPermissions: Permission[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.hasPermission(...requiredPermissions)) {
      return true;
    }

    return router.createUrlTree(['/'], { queryParams: { forbidden: true } });
  };
};
