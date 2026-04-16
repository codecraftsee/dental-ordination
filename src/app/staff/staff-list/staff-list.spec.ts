import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import StaffList from './staff-list';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { UserRole } from '../../models/user.model';
import { TranslateService } from '../../services/translate.service';

const mockUser = {
  id: '1',
  email: 'doctor@test.com',
  firstName: 'John',
  lastName: 'Doe',
  role: UserRole.Doctor,
  isActive: true,
  mustSetPassword: false,
  permissions: [],
  createdAt: '2024-01-01T00:00:00',
  updatedAt: '2024-01-01T00:00:00',
};

describe('StaffList', () => {
  let component: StaffList;
  let fixture: ComponentFixture<StaffList>;
  let userService: { loadAll: ReturnType<typeof vi.fn>; search: ReturnType<typeof vi.fn>; getAll: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    userService = {
      loadAll: vi.fn().mockReturnValue(of([mockUser])),
      search: vi.fn().mockReturnValue([mockUser]),
      getAll: vi.fn().mockReturnValue([mockUser]),
    };

    await TestBed.configureTestingModule({
      imports: [StaffList],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            user: signal({ id: 'current-user-id' }),
            hasPermission: () => true,
            hasAnyPermission: () => true,
            userPermissions: signal([]),
          },
        },
        { provide: UserService, useValue: userService },
        { provide: TranslateService, useValue: { instant: (k: string) => k, translate: (k: string) => k, get: (k: string) => of(k), currentLang: signal('en'), version: signal('en') } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StaffList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadAll on init', () => {
    expect(userService.loadAll).toHaveBeenCalled();
  });

  it('should update searchQuery on search', () => {
    const input = document.createElement('input');
    input.value = 'John';
    component.onSearch({ target: input } as unknown as Event);
    expect(component.searchQuery()).toBe('John');
  });

  it('should update roleFilter on role change', () => {
    component.roleFilter.set(UserRole.Doctor);
    expect(component.roleFilter()).toBe(UserRole.Doctor);
  });
});
