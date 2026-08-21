import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import Home from './home';
import { TranslateService } from '../services/translate.service';
import { AuthService } from '../services/auth.service';
import { PatientService } from '../services/patient.service';
import { UserService } from '../services/user.service';
import { VisitService } from '../services/visit.service';
import { DiagnosisService } from '../services/diagnosis.service';
import { TreatmentService } from '../services/treatment.service';
import { Visit } from '../models/visit.model';
import { Permission, UserRole } from '../models/user.model';

const visits: Visit[] = [
  {
    id: 'v1',
    patientId: 'p1',
    doctorId: 'd1',
    date: '2026-03-10',
    toothNumber: null,
    paid: true,
    createdAt: '',
    updatedAt: '',
  },
];

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let component: Home;
  let patients: ReturnType<typeof signal<unknown[]>>;

  beforeEach(async () => {
    patients = signal<unknown[]>([]);

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        {
          provide: TranslateService,
          useValue: {
            translate: (key: string) => key,
            instant: (key: string) => key,
            format: (key: string) => key,
            version: signal('en'),
            currentLang: signal('en'),
          },
        },
        {
          provide: AuthService,
          useValue: {
            hasPermission: () => true,
            hasAnyPermission: () => true,
            // Read by HasPermissionPipe to make itself reactive.
            userPermissions: signal<Permission[]>(Object.values(Permission)),
          },
        },
        { provide: PatientService, useValue: { loadAll: () => of([]), getAll: () => patients(), getById: () => undefined } },
        {
          provide: UserService,
          useValue: {
            loadAll: () => of([]),
            getByRole: (role: UserRole) => (role === UserRole.Doctor ? [{ id: 'd1' }, { id: 'd2' }] : []),
            getDisplayName: () => 'Dr. Petar',
          },
        },
        {
          provide: VisitService,
          useValue: {
            loadAll: () => of([]),
            getAll: () => visits,
            getRecent: () => visits,
            getThisMonthCount: () => 1,
          },
        },
        { provide: DiagnosisService, useValue: { loadAll: () => of([]), getById: () => ({ name: 'Karijes' }) } },
        { provide: TreatmentService, useValue: { loadAll: () => of([]), getById: () => ({ name: 'Plomba' }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
  });

  it('marks itself loaded once every permitted cache has loaded', () => {
    expect(component.loaded()).toBe(false);
    fixture.detectChanges();
    expect(component.loaded()).toBe(true);
  });

  it('derives the dashboard counters from the service caches', () => {
    fixture.detectChanges();
    expect(component.totalDoctors()).toBe(2);
    expect(component.totalVisits()).toBe(1);
    expect(component.visitsThisMonth()).toBe(1);
    expect(component.recentVisits()).toEqual(visits);
  });

  it('recomputes counters when a cache changes underneath it', () => {
    // Home no longer reloads itself after an import — the import service refreshes
    // the caches and these computed values follow.
    fixture.detectChanges();
    expect(component.totalPatients()).toBe(0);

    patients.set([{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }]);

    expect(component.totalPatients()).toBe(3);
  });





  it('resolves related entity names for the recent visits table', () => {
    fixture.detectChanges();
    expect(component.getDoctorName('d1')).toBe('Dr. Petar');
    expect(component.getDiagnosisName('dx1')).toBe('Karijes');
    expect(component.getTreatmentName('tx1')).toBe('Plomba');
    expect(component.getDiagnosisName(undefined)).toBe('');
    expect(component.getTreatmentName(undefined)).toBe('');
    expect(component.getPatientName('p1')).toBe('');
  });
});
