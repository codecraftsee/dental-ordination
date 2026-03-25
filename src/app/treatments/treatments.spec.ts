import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import Treatments from './treatments';
import { TranslateService } from '../services/translate.service';
import { TreatmentService } from '../services/treatment.service';
import { ConfirmDialogService } from '../services/confirm-dialog.service';

describe('Treatments', () => {
  let component: Treatments;
  let fixture: ComponentFixture<Treatments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Treatments],
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

    fixture = TestBed.createComponent(Treatments);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('initializes with empty search query', () => {
    expect(component.searchQuery()).toBe('');
  });

  it('initializes with empty category filter', () => {
    expect(component.categoryFilter()).toBe('');
  });

  it('has treatment categories available', () => {
    expect(component.categories.length).toBeGreaterThan(0);
  });

  it('has displayedColumns defined', () => {
    expect(component.displayedColumns).toEqual(['code', 'name', 'category', 'defaultPrice', 'description', 'actions']);
  });

  it('deleteTreatment calls confirm dialog and does not delete when cancelled', () => {
    const confirmDialogService = TestBed.inject(ConfirmDialogService);
    const treatmentService = TestBed.inject(TreatmentService);
    const deleteSpy = vi.spyOn(treatmentService, 'delete');
    (confirmDialogService.confirm as ReturnType<typeof vi.fn>).mockReturnValue(of(false));

    component.deleteTreatment('t1');

    expect(confirmDialogService.confirm).toHaveBeenCalledWith('treatment.deleteTitle', 'treatment.deleteMessage');
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('deleteTreatment deletes when confirmed', () => {
    const confirmDialogService = TestBed.inject(ConfirmDialogService);
    const treatmentService = TestBed.inject(TreatmentService);
    const deleteSpy = vi.spyOn(treatmentService, 'delete').mockReturnValue(of(undefined));
    (confirmDialogService.confirm as ReturnType<typeof vi.fn>).mockReturnValue(of(true));

    component.deleteTreatment('t1');

    expect(deleteSpy).toHaveBeenCalledWith('t1');
  });
});
