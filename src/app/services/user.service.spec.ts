import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { User, UserRole } from '../models/user.model';
import { environment } from '../../environments/environment';

const mockUser: User = {
  id: '1',
  email: 'doctor@test.com',
  firstName: 'John',
  lastName: 'Doe',
  role: UserRole.Doctor,
  isActive: true,
  mustSetPassword: false,
  createdAt: '2024-01-01T00:00:00',
  updatedAt: '2024-01-01T00:00:00',
};

describe('UserService', () => {
  let service: UserService;
  let http: HttpTestingController;
  const baseUrl = environment.apiUrl + '/api/users';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load all users and cache them', () => {
    service.loadAll().subscribe(users => {
      expect(users.length).toBe(1);
      expect(service.getAll().length).toBe(1);
    });
    http.expectOne(baseUrl).flush([mockUser]);
  });

  it('should filter by role', () => {
    service.loadAll().subscribe();
    http.expectOne(baseUrl).flush([mockUser]);
    expect(service.getByRole(UserRole.Doctor).length).toBe(1);
    expect(service.getByRole(UserRole.Nurse).length).toBe(0);
  });

  it('should load with role query param', () => {
    service.loadAll({ role: UserRole.Doctor }).subscribe();
    const req = http.expectOne(`${baseUrl}?role=doctor`);
    req.flush([mockUser]);
  });

  it('should return display name with Dr. prefix for doctors', () => {
    service.loadAll().subscribe();
    http.expectOne(baseUrl).flush([mockUser]);
    expect(service.getDisplayName('1')).toBe('Dr. John Doe');
  });

  it('should create a user and update cache', () => {
    service.create({ email: 'new@test.com', firstName: 'New', lastName: 'User', role: UserRole.Nurse }).subscribe();
    http.expectOne(baseUrl).flush({ ...mockUser, id: '2', role: UserRole.Nurse });
    expect(service.getAll().length).toBe(1);
  });

  it('should search by name', () => {
    service.loadAll().subscribe();
    http.expectOne(baseUrl).flush([mockUser]);
    expect(service.search('John', {})).toHaveLength(1);
    expect(service.search('xyz', {})).toHaveLength(0);
  });
});
