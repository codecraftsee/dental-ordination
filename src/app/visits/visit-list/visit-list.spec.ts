import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import VisitList from './visit-list';
import { TranslateService } from '../../services/translate.service';
import { VisitService } from '../../services/visit.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

describe('VisitList', () => {
  let component: VisitList;
  let fixture: ComponentFixture<VisitList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitList],
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

    fixture = TestBed.createComponent(VisitList);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('initializes with empty search query', () => {
    expect(component.searchQuery()).toBe('');
  });

  it('has displayedColumns defined', () => {
    expect(component.displayedColumns).toEqual([
      'date',
      'patient',
      'doctor',
      'tooth',
      'diagnosis',
      'treatment',
      'price',
      'actions',
    ]);
  });

  it('deleteVisit calls confirm dialog and does not delete when cancelled', () => {
    const confirmDialogService = TestBed.inject(ConfirmDialogService);
    const visitService = TestBed.inject(VisitService);
    const deleteSpy = vi.spyOn(visitService, 'delete');
    (confirmDialogService.confirm as ReturnType<typeof vi.fn>).mockReturnValue(of(false));

    component.deleteVisit('v1');

    expect(confirmDialogService.confirm).toHaveBeenCalledWith('visit.deleteTitle', 'visit.deleteMessage');
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('deleteVisit deletes when confirmed', () => {
    const confirmDialogService = TestBed.inject(ConfirmDialogService);
    const visitService = TestBed.inject(VisitService);
    const deleteSpy = vi.spyOn(visitService, 'delete').mockReturnValue(of(undefined));
    (confirmDialogService.confirm as ReturnType<typeof vi.fn>).mockReturnValue(of(true));

    component.deleteVisit('v1');

    expect(deleteSpy).toHaveBeenCalledWith('v1');
  });
});
