import { Pipe, PipeTransform, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Permission } from '../models/user.model';

@Pipe({
  name: 'hasPermission',
  pure: false,
})
export class HasPermissionPipe implements PipeTransform {
  private authService = inject(AuthService);

  transform(permission: Permission | Permission[]): boolean {
    this.authService.userPermissions();
    const perms = Array.isArray(permission) ? permission : [permission];
    return this.authService.hasPermission(...perms);
  }
}
