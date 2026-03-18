import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../translate.pipe';

@Component({
  selector: 'app-searchable-select',
  imports: [MatFormFieldModule, MatSelectModule, MatOptionModule, MatIconModule, TranslatePipe],
  templateUrl: './searchable-select.html',
  styleUrl: './searchable-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelect),
      multi: true,
    },
  ],
})
export class SearchableSelect<T, V = unknown> implements ControlValueAccessor {
  options = input<T[]>([]);
  displayWith = input<(item: T) => string>((item: T) => String(item));
  valueWith = input<(item: T) => V>((item: T) => item as unknown as V);
  label = input('');
  showAllOption = input(false);
  allOptionLabel = input('');
  errorMessage = input('');

  selectionChange = output<V | string>();

  searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  searchTerm = signal('');
  value = signal<V | string>('');
  disabled = signal(false);

  private onChange: (value: V | string) => void = () => {};
  private onTouched: () => void = () => {};

  filteredOptions = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const displayFn = this.displayWith();
    if (!term) return this.options();
    return this.options().filter(opt => displayFn(opt).toLowerCase().includes(term));
  });

  onOpenedChange(opened: boolean): void {
    if (opened) {
      setTimeout(() => this.searchInput()?.nativeElement.focus());
    } else {
      this.searchTerm.set('');
    }
  }

  onSelectionChange(value: V | string): void {
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
    this.selectionChange.emit(value);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' && event.key !== 'Tab') {
      event.stopPropagation();
    }
  }

  writeValue(value: V | string): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: V | string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
