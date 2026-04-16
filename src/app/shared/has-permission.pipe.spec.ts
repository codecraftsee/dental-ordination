import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HasPermissionPipe } from './has-permission.pipe';
import { AuthService } from '../services/auth.service';
import { Permission } from '../models/user.model';

describe('HasPermissionPipe', () => {
  const permissions = signal<Permission[]>([Permission.PatientsRead, Permission.PatientsCreate]);

  const mockAuthService = {
    userPermissions: permissions.asReadonly(),
    hasPermission: (...perms: Permission[]) => perms.every(p => permissions().includes(p)),
    hasAnyPermission: (...perms: Permission[]) => perms.some(p => permissions().includes(p)),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    });
  });

  it('returns true when user has the permission', () => {
    const pipe = TestBed.runInInjectionContext(() => new HasPermissionPipe());
    expect(pipe.transform(Permission.PatientsRead)).toBe(true);
  });

  it('returns false when user lacks the permission', () => {
    const pipe = TestBed.runInInjectionContext(() => new HasPermissionPipe());
    expect(pipe.transform(Permission.AdminBulkDelete)).toBe(false);
  });

  it('checks all permissions when given an array', () => {
    const pipe = TestBed.runInInjectionContext(() => new HasPermissionPipe());
    expect(pipe.transform([Permission.PatientsRead, Permission.PatientsCreate])).toBe(true);
    expect(pipe.transform([Permission.PatientsRead, Permission.AdminBulkDelete])).toBe(false);
  });
});
