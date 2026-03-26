import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import PatientList from './patient-list';
import { TranslateService } from '../../services/translate.service';
import { PatientService } from '../../services/patient.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

describe('PatientList', () => {
  let component: PatientList;
  let fixture: ComponentFixture<PatientList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientList],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: TranslateService,
          useValue: {
            translate: (key: string) => key,
            instant: (key: string) => key,
            version: signal('en'),
            currentLang: signal('en'),
          },
        },
        {
          provide: ConfirmDialogService,
          useValue: { confirm: vi.fn().mockReturnValue(of(false)) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientList);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('initializes with empty search query', () => {
    expect(component.searchQuery()).toBe('');
  });

  it('has displayedColumns defined', () => {
    expect(component.displayedColumns).toEqual(['name', 'parentName', 'dateOfBirth', 'city', 'phone', 'actions']);
  });

  it('deletePatient calls confirm dialog and does not delete when cancelled', () => {
    const confirmDialogService = TestBed.inject(ConfirmDialogService);
    const patientService = TestBed.inject(PatientService);
    const deleteSpy = vi.spyOn(patientService, 'delete');
    (confirmDialogService.confirm as ReturnType<typeof vi.fn>).mockReturnValue(of(false));

    component.deletePatient('p1');

    expect(confirmDialogService.confirm).toHaveBeenCalledWith('patient.deleteTitle', 'patient.deleteMessage');
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('deletePatient deletes when confirmed', () => {
    const confirmDialogService = TestBed.inject(ConfirmDialogService);
    const patientService = TestBed.inject(PatientService);
    const deleteSpy = vi.spyOn(patientService, 'delete').mockReturnValue(of(undefined));
    (confirmDialogService.confirm as ReturnType<typeof vi.fn>).mockReturnValue(of(true));

    component.deletePatient('p1');

    expect(deleteSpy).toHaveBeenCalledWith('p1');
  });
});
