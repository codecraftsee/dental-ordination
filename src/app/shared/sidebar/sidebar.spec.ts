import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Sidebar } from './sidebar';
import { AuthService } from '../../services/auth.service';
import { TranslateService } from '../../services/translate.service';
import { Permission } from '../../models/user.model';

describe('Sidebar', () => {
  let component: Sidebar;
  let fixture: ComponentFixture<Sidebar>;
  const userPermissions = signal<Permission[]>([]);

  const mockAuthService = {
    userPermissions: userPermissions.asReadonly(),
    hasPermission: (...perms: Permission[]) => perms.every(p => userPermissions().includes(p)),
  };

  beforeEach(async () => {
    userPermissions.set(Object.values(Permission));

    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: TranslateService,
          useValue: {
            translate: (key: string) => key,
            instant: (key: string) => key,
            version: signal('en'),
            currentLang: signal('en'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('shows all 7 nav links when user has all permissions', () => {
    expect(component.navLinks().length).toBe(7);
  });

  it('home link uses exact matching', () => {
    const home = component.navLinks().find(l => l.route === '/');
    expect(home?.exact).toBe(true);
  });

  it('all non-home links use non-exact matching', () => {
    const nonHome = component.navLinks().filter(l => l.route !== '/');
    expect(nonHome.every(l => l.exact === false)).toBe(true);
  });

  it('every nav link has a route, label, and icon', () => {
    for (const link of component.navLinks()) {
      expect(link.route).toBeTruthy();
      expect(link.label).toBeTruthy();
      expect(link.icon).toBeTruthy();
    }
  });

  it('hides admin link when user lacks admin permission', () => {
    userPermissions.set([Permission.PatientsRead, Permission.VisitsRead, Permission.DiagnosesRead, Permission.TreatmentsRead, Permission.UsersRead]);
    const links = component.navLinks();
    expect(links.find(l => l.route === '/admin')).toBeUndefined();
  });

  it('always shows home link regardless of permissions', () => {
    userPermissions.set([]);
    const links = component.navLinks();
    expect(links.find(l => l.route === '/')).toBeTruthy();
    expect(links.length).toBe(1);
  });

  it('renders a list item for each visible nav link', () => {
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('[mat-list-item]');
    expect(items.length).toBe(component.navLinks().length);
  });
});
