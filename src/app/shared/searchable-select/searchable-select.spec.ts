import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SearchableSelect } from './searchable-select';
import { TranslateService } from '../../services/translate.service';

interface TestItem {
  id: string;
  name: string;
}

@Component({
  imports: [ReactiveFormsModule, SearchableSelect],
  template: `
    <app-searchable-select
      [options]="items"
      [displayWith]="displayFn"
      [valueWith]="valueFn"
      [formControl]="control"
      label="Test" />
  `,
})
class TestHost {
  items: TestItem[] = [
    { id: '1', name: 'Alpha' },
    { id: '2', name: 'Beta' },
    { id: '3', name: 'Gamma' },
  ];
  control = new FormControl('');
  displayFn = (item: TestItem) => item.name;
  valueFn = (item: TestItem) => item.id;
}

describe('SearchableSelect', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
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
    const select = fixture.debugElement.query(
      (de) => de.componentInstance instanceof SearchableSelect,
    );
    expect(select).toBeTruthy();
  });

  it('writes value from form control', () => {
    host.control.setValue('2');
    fixture.detectChanges();
    const select = fixture.debugElement.query(
      (de) => de.componentInstance instanceof SearchableSelect,
    );
    const comp = select.componentInstance as SearchableSelect<TestItem, string>;
    expect(comp.value()).toBe('2');
  });

  it('filters options by search term', () => {
    const select = fixture.debugElement.query(
      (de) => de.componentInstance instanceof SearchableSelect,
    );
    const comp = select.componentInstance as SearchableSelect<TestItem, string>;
    comp.searchTerm.set('alp');
    expect(comp.filteredOptions().length).toBe(1);
    expect(comp.filteredOptions()[0].name).toBe('Alpha');
  });

  it('shows all options when search is empty', () => {
    const select = fixture.debugElement.query(
      (de) => de.componentInstance instanceof SearchableSelect,
    );
    const comp = select.componentInstance as SearchableSelect<TestItem, string>;
    comp.searchTerm.set('');
    expect(comp.filteredOptions().length).toBe(3);
  });

  it('returns empty filtered options for non-matching search', () => {
    const select = fixture.debugElement.query(
      (de) => de.componentInstance instanceof SearchableSelect,
    );
    const comp = select.componentInstance as SearchableSelect<TestItem, string>;
    comp.searchTerm.set('xyz');
    expect(comp.filteredOptions().length).toBe(0);
  });

  it('clears search term on panel close', () => {
    const select = fixture.debugElement.query(
      (de) => de.componentInstance instanceof SearchableSelect,
    );
    const comp = select.componentInstance as SearchableSelect<TestItem, string>;
    comp.searchTerm.set('test');
    comp.onOpenedChange(false);
    expect(comp.searchTerm()).toBe('');
  });

  it('emits selectionChange on value change', () => {
    const select = fixture.debugElement.query(
      (de) => de.componentInstance instanceof SearchableSelect,
    );
    const comp = select.componentInstance as SearchableSelect<TestItem, string>;
    let emitted: string | undefined;
    comp.selectionChange.subscribe((val: string) => (emitted = val));
    comp.onSelectionChange('1');
    expect(emitted).toBe('1');
  });

  it('updates form control on selection', () => {
    const select = fixture.debugElement.query(
      (de) => de.componentInstance instanceof SearchableSelect,
    );
    const comp = select.componentInstance as SearchableSelect<TestItem, string>;
    comp.onSelectionChange('3');
    expect(host.control.value).toBe('3');
  });
});

describe('SearchableSelect with showAllOption', () => {
  it('renders the all option', async () => {
    @Component({
      imports: [SearchableSelect],
      template: `
        <app-searchable-select
          [options]="[]"
          [showAllOption]="true"
          allOptionLabel="All Items" />
      `,
    })
    class AllOptHost {}

    await TestBed.configureTestingModule({
      imports: [AllOptHost],
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

    const fixture = TestBed.createComponent(AllOptHost);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
