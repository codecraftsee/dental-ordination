import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import DentalCard from './dental-card';

describe('DentalCard', () => {
  let component: DentalCard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'p1' } } } },
      ],
    });
    component = TestBed.createComponent(DentalCard).componentInstance;
  });

  it('displayedColumns includes paid column', () => {
    expect(component.displayedColumns).toContain('paid');
  });

  it('paid column is between price and doctor', () => {
    const cols = component.displayedColumns;
    const priceIdx = cols.indexOf('price');
    const paidIdx = cols.indexOf('paid');
    const doctorIdx = cols.indexOf('doctor');
    expect(paidIdx).toBe(priceIdx + 1);
    expect(doctorIdx).toBe(paidIdx + 1);
  });
});
