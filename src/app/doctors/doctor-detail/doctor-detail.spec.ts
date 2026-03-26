import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import DoctorDetail from './doctor-detail';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { DoctorService } from '../../services/doctor.service';
import { Specialization } from '../../models/doctor.model';

describe('DoctorDetail', () => {
  let component: DoctorDetail;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'd1' } } } },
        { provide: ConfirmDialogService, useValue: { confirm: vi.fn().mockReturnValue(of(false)) } },
      ],
    });
    component = TestBed.createComponent(DoctorDetail).componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('deleteDoctor does not delete when dialog is cancelled', () => {
    const confirmDialogService = TestBed.inject(ConfirmDialogService);
    const doctorService = TestBed.inject(DoctorService);
    const deleteSpy = vi.spyOn(doctorService, 'delete');
    (confirmDialogService.confirm as ReturnType<typeof vi.fn>).mockReturnValue(of(false));
    component.doctor.set({ id: 'd1', firstName: 'John', lastName: 'Doe', specialization: Specialization.GeneralDentistry, createdAt: '', updatedAt: '' });

    component.deleteDoctor();

    expect(confirmDialogService.confirm).toHaveBeenCalled();
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('deleteDoctor deletes and navigates when confirmed', () => {
    const confirmDialogService = TestBed.inject(ConfirmDialogService);
    const doctorService = TestBed.inject(DoctorService);
    const router = TestBed.inject(Router);
    const deleteSpy = vi.spyOn(doctorService, 'delete').mockReturnValue(of(undefined));
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    (confirmDialogService.confirm as ReturnType<typeof vi.fn>).mockReturnValue(of(true));
    component.doctor.set({ id: 'd1', firstName: 'John', lastName: 'Doe', specialization: Specialization.GeneralDentistry, createdAt: '', updatedAt: '' });

    component.deleteDoctor();

    expect(deleteSpy).toHaveBeenCalledWith('d1');
    expect(navigateSpy).toHaveBeenCalledWith(['/doctors']);
  });
});
