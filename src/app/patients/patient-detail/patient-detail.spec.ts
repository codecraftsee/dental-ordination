import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import PatientDetail from './patient-detail';
import { Visit } from '../../models/visit.model';

const mockVisits: Visit[] = [
  { id: 'v1', patientId: 'p1', doctorId: 'd1', date: '2024-01-01', toothNumber: null, price: 1000, paid: false, createdAt: '', updatedAt: '' },
  { id: 'v2', patientId: 'p1', doctorId: 'd1', date: '2024-02-01', toothNumber: null, price: 2000, paid: true, createdAt: '', updatedAt: '' },
  { id: 'v3', patientId: 'p1', doctorId: 'd1', date: '2024-03-01', toothNumber: null, price: 500, paid: false, createdAt: '', updatedAt: '' },
  { id: 'v4', patientId: 'p1', doctorId: 'd1', date: '2024-04-01', toothNumber: null, paid: false, createdAt: '', updatedAt: '' },
];

describe('PatientDetail debt signals', () => {
  let component: PatientDetail;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'p1' } } } },
      ],
    });
    component = TestBed.createComponent(PatientDetail).componentInstance;
  });

  it('patientDebt sums only unpaid visits with prices', () => {
    (component as unknown as { allVisits: ReturnType<typeof signal> }).allVisits = signal(mockVisits);
    // Re-create computed by accessing the component's computed
    // Since allVisits is a signal, we set it directly
    component.allVisits.set(mockVisits);

    // v1: 1000 unpaid, v2: 2000 paid (skip), v3: 500 unpaid, v4: no price unpaid (skip)
    expect(component.patientDebt()).toBe(1500);
  });

  it('hasUnpaidVisits returns true when unpaid visits exist', () => {
    component.allVisits.set(mockVisits);
    expect(component.hasUnpaidVisits()).toBe(true);
  });

  it('hasUnpaidVisits returns false when all visits are paid', () => {
    const allPaid = mockVisits.map(v => ({ ...v, paid: true }));
    component.allVisits.set(allPaid);
    expect(component.hasUnpaidVisits()).toBe(false);
  });

  it('patientDebt returns 0 when all visits are paid', () => {
    const allPaid = mockVisits.map(v => ({ ...v, paid: true }));
    component.allVisits.set(allPaid);
    expect(component.patientDebt()).toBe(0);
  });
});
