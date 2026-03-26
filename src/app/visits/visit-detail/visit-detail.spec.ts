import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import VisitDetail from './visit-detail';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { VisitService } from '../../services/visit.service';
import { Visit } from '../../models/visit.model';

describe('VisitDetail', () => {
  let component: VisitDetail;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'v1' } } } },
        { provide: ConfirmDialogService, useValue: { confirm: vi.fn().mockReturnValue(of(false)) } },
      ],
    });
    component = TestBed.createComponent(VisitDetail).componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('deleteVisit does not delete when dialog is cancelled', () => {
    const confirmDialogService = TestBed.inject(ConfirmDialogService);
    const visitService = TestBed.inject(VisitService);
    const deleteSpy = vi.spyOn(visitService, 'delete');
    (confirmDialogService.confirm as ReturnType<typeof vi.fn>).mockReturnValue(of(false));
    const mockVisit: Visit = { id: 'v1', patientId: 'p1', doctorId: 'd1', date: '2024-01-01', toothNumber: null, paid: false, createdAt: '', updatedAt: '' };
    component.visit.set(mockVisit);

    component.deleteVisit();

    expect(confirmDialogService.confirm).toHaveBeenCalled();
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('deleteVisit deletes and navigates when confirmed', () => {
    const confirmDialogService = TestBed.inject(ConfirmDialogService);
    const visitService = TestBed.inject(VisitService);
    const router = TestBed.inject(Router);
    const deleteSpy = vi.spyOn(visitService, 'delete').mockReturnValue(of(undefined));
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    (confirmDialogService.confirm as ReturnType<typeof vi.fn>).mockReturnValue(of(true));
    const mockVisit: Visit = { id: 'v1', patientId: 'p1', doctorId: 'd1', date: '2024-01-01', toothNumber: null, paid: false, createdAt: '', updatedAt: '' };
    component.visit.set(mockVisit);

    component.deleteVisit();

    expect(deleteSpy).toHaveBeenCalledWith('v1');
    expect(navigateSpy).toHaveBeenCalledWith(['/visits']);
  });
});
