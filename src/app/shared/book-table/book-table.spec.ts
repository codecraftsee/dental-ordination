import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { BookTableComponent } from './book-table';
import { TranslateService } from '../../services/translate.service';

const mockData = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
  { id: '3', name: 'Charlie' },
];

@Component({
  imports: [BookTableComponent],
  template: `
    <app-book-table [data]="data()">
      <ng-template #bookPage let-item>
        <div class="test-page">{{ item.name }}</div>
      </ng-template>
    </app-book-table>
  `,
})
class TestHost {
  data = signal<unknown[]>(mockData);
}

describe('BookTableComponent', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    // Mock matchMedia for mobile
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(max-width: 767px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    await TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [
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

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    const bookTable = fixture.nativeElement.querySelector('app-book-table');
    expect(bookTable).toBeTruthy();
  });

  it('renders book container on mobile', () => {
    const container = fixture.nativeElement.querySelector('.book-container');
    expect(container).toBeTruthy();
  });

  it('renders first item content via template', () => {
    const page = fixture.nativeElement.querySelector('.test-page');
    expect(page?.textContent).toBe('Alice');
  });

  it('shows page indicator with correct initial values', () => {
    const indicator = fixture.nativeElement.querySelector('.page-indicator');
    expect(indicator?.textContent?.trim()).toBe('1 / 3');
  });

  it('disables previous button on first page', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.book-nav button');
    const prevBtn = buttons[0];
    expect(prevBtn.disabled).toBe(true);
  });

  it('enables next button when more pages exist', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.book-nav button');
    const nextBtn = buttons[1];
    expect(nextBtn.disabled).toBe(false);
  });

  it('navigates to next page on next button click', async () => {
    const buttons = fixture.nativeElement.querySelectorAll('.book-nav button');
    const nextBtn = buttons[1];
    nextBtn.click();

    // Wait for animation timeout
    await new Promise((r) => setTimeout(r, 600));
    fixture.detectChanges();

    const page = fixture.nativeElement.querySelector('.test-page');
    expect(page?.textContent).toBe('Bob');

    const indicator = fixture.nativeElement.querySelector('.page-indicator');
    expect(indicator?.textContent?.trim()).toBe('2 / 3');
  });

  it('navigates backward after going forward', async () => {
    const buttons = fixture.nativeElement.querySelectorAll('.book-nav button');

    // Go forward
    buttons[1].click();
    await new Promise((r) => setTimeout(r, 600));
    fixture.detectChanges();

    // Go backward
    buttons[0].click();
    await new Promise((r) => setTimeout(r, 600));
    fixture.detectChanges();

    const page = fixture.nativeElement.querySelector('.test-page');
    expect(page?.textContent).toBe('Alice');
  });

  it('disables next button on last page', async () => {
    const buttons = fixture.nativeElement.querySelectorAll('.book-nav button');

    // Navigate to last page
    buttons[1].click();
    await new Promise((r) => setTimeout(r, 600));
    fixture.detectChanges();

    buttons[1].click();
    await new Promise((r) => setTimeout(r, 600));
    fixture.detectChanges();

    expect(buttons[1].disabled).toBe(true);
  });

  it('resets to page 0 when data changes', async () => {
    const buttons = fixture.nativeElement.querySelectorAll('.book-nav button');

    // Go to page 2
    buttons[1].click();
    await new Promise((r) => setTimeout(r, 600));
    fixture.detectChanges();

    // Change data
    host.data.set([{ id: '4', name: 'Dave' }, { id: '5', name: 'Eve' }]);
    fixture.detectChanges();

    const page = fixture.nativeElement.querySelector('.test-page');
    expect(page?.textContent).toBe('Dave');
  });

  it('shows empty state when data is empty', () => {
    host.data.set([]);
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector('.book-empty');
    expect(empty).toBeTruthy();
  });

  it('handles swipe left to go next', async () => {
    const bookEl = fixture.nativeElement.querySelector('app-book-table');

    bookEl.dispatchEvent(new TouchEvent('touchstart', {
      touches: [new Touch({ identifier: 0, target: bookEl, clientX: 200, clientY: 100 })],
    }));
    bookEl.dispatchEvent(new TouchEvent('touchend', {
      changedTouches: [new Touch({ identifier: 0, target: bookEl, clientX: 100, clientY: 100 })],
    }));

    await new Promise((r) => setTimeout(r, 600));
    fixture.detectChanges();

    const page = fixture.nativeElement.querySelector('.test-page');
    expect(page?.textContent).toBe('Bob');
  });

  it('handles swipe right to go previous', async () => {
    const bookEl = fixture.nativeElement.querySelector('app-book-table');
    const buttons = fixture.nativeElement.querySelectorAll('.book-nav button');

    // First go to page 2
    buttons[1].click();
    await new Promise((r) => setTimeout(r, 600));
    fixture.detectChanges();

    // Swipe right
    bookEl.dispatchEvent(new TouchEvent('touchstart', {
      touches: [new Touch({ identifier: 0, target: bookEl, clientX: 100, clientY: 100 })],
    }));
    bookEl.dispatchEvent(new TouchEvent('touchend', {
      changedTouches: [new Touch({ identifier: 0, target: bookEl, clientX: 200, clientY: 100 })],
    }));

    await new Promise((r) => setTimeout(r, 600));
    fixture.detectChanges();

    const page = fixture.nativeElement.querySelector('.test-page');
    expect(page?.textContent).toBe('Alice');
  });

  it('handles keyboard right arrow to go next', async () => {
    const bookEl = fixture.nativeElement.querySelector('app-book-table');
    bookEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

    await new Promise((r) => setTimeout(r, 600));
    fixture.detectChanges();

    const page = fixture.nativeElement.querySelector('.test-page');
    expect(page?.textContent).toBe('Bob');
  });

  it('handles keyboard left arrow to go previous', async () => {
    const bookEl = fixture.nativeElement.querySelector('app-book-table');
    const buttons = fixture.nativeElement.querySelectorAll('.book-nav button');

    // First go forward
    buttons[1].click();
    await new Promise((r) => setTimeout(r, 600));
    fixture.detectChanges();

    // Then arrow left
    bookEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    await new Promise((r) => setTimeout(r, 600));
    fixture.detectChanges();

    const page = fixture.nativeElement.querySelector('.test-page');
    expect(page?.textContent).toBe('Alice');
  });

  it('has aria-live region on page indicator', () => {
    const indicator = fixture.nativeElement.querySelector('[aria-live="polite"]');
    expect(indicator).toBeTruthy();
  });
});
