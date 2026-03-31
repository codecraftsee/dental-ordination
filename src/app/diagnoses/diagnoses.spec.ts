import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import Diagnoses from './diagnoses';
import { TranslateService } from '../services/translate.service';
import { DiagnosisService } from '../services/diagnosis.service';
import { ConfirmDialogService } from '../services/confirm-dialog.service';
import { Diagnosis, DiagnosisCategory } from '../models/diagnosis.model';

describe('Diagnoses', () => {
  let component: Diagnoses;
  let fixture: ComponentFixture<Diagnoses>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Diagnoses],
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

    fixture = TestBed.createComponent(Diagnoses);
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

  it('updates search query on search event', () => {
    const event = { target: { value: 'caries' } } as unknown as Event;
    component.onSearch(event);
    expect(component.searchQuery()).toBe('caries');
  });

  it('has diagnosis categories available', () => {
    expect(component.categories.length).toBeGreaterThan(0);
  });

  it('has displayedColumns defined', () => {
    expect(component.displayedColumns).toEqual(['code', 'name', 'category', 'description', 'actions']);
  });

  it('renders add new link pointing to /diagnoses/new', () => {
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a[href="/diagnoses/new"]');
    expect(link).toBeTruthy();
  });

  it('deleteDiagnosis calls confirm dialog and does not delete when cancelled', () => {
    const confirmDialogService = TestBed.inject(ConfirmDialogService);
    const diagnosisService = TestBed.inject(DiagnosisService);
    const deleteSpy = vi.spyOn(diagnosisService, 'delete');
    (confirmDialogService.confirm as ReturnType<typeof vi.fn>).mockReturnValue(of(false));

    component.deleteDiagnosis('dg1');

    expect(confirmDialogService.confirm).toHaveBeenCalledWith('diagnosis.deleteTitle', 'diagnosis.deleteMessage');
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('dataSource.sort is connected and reflects default active sort after template renders', () => {
    fixture.detectChanges();
    expect(component.dataSource.sort).not.toBeNull();
    expect(component.dataSource.sort!.active).toBe('name');
    expect(component.dataSource.sort!.direction).toBe('asc');
  });

  it('dataSource.data updates when filteredDiagnoses signal changes', () => {
    const diagnosisService = TestBed.inject(DiagnosisService);
    const mockDiagnoses: Diagnosis[] = [
      { id: '1', code: 'K01', name: 'Alpha', category: DiagnosisCategory.Caries, createdAt: '' },
      { id: '2', code: 'K02', name: 'Beta', category: DiagnosisCategory.Periodontal, createdAt: '' },
    ];
    vi.spyOn(diagnosisService, 'search').mockReturnValue(mockDiagnoses);
    component.searchQuery.set('test');
    fixture.detectChanges();
    expect(component.dataSource.data).toEqual(mockDiagnoses);
    expect(component.filteredDiagnoses()).toEqual(mockDiagnoses);
  });

  it('sortData sorts diagnoses by name ascending', () => {
    fixture.detectChanges();
    const diagA: Diagnosis = { id: '1', code: 'K02', name: 'Zebra', category: DiagnosisCategory.Caries, createdAt: '' };
    const diagB: Diagnosis = { id: '2', code: 'K01', name: 'Alpha', category: DiagnosisCategory.Periodontal, createdAt: '' };
    component.dataSource.data = [diagA, diagB];
    const sort = component.dataSource.sort!;
    sort.sort({ id: 'name', start: 'asc', disableClear: false });
    const sorted = component.dataSource.sortData([diagA, diagB], sort);
    expect(sorted[0].name).toBe('Alpha');
    expect(sorted[1].name).toBe('Zebra');
  });

  it('deleteDiagnosis deletes when confirmed', () => {
    const confirmDialogService = TestBed.inject(ConfirmDialogService);
    const diagnosisService = TestBed.inject(DiagnosisService);
    const deleteSpy = vi.spyOn(diagnosisService, 'delete').mockReturnValue(of(undefined));
    (confirmDialogService.confirm as ReturnType<typeof vi.fn>).mockReturnValue(of(true));

    component.deleteDiagnosis('dg1');

    expect(deleteSpy).toHaveBeenCalledWith('dg1');
  });
});
