import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, computed, effect, viewChild, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { filter, switchMap } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '../shared/translate.pipe';
import { CurrencyFormatPipe } from '../shared/currency-format.pipe';
import { TreatmentService } from '../services/treatment.service';
import { ConfirmDialogService } from '../services/confirm-dialog.service';
import { ToastService } from '../services/toast.service';
import { HasPermissionPipe } from '../shared/has-permission.pipe';
import { Treatment, TreatmentCategory } from '../models/treatment.model';
import { Permission } from '../models/user.model';

@Component({
  selector: 'app-treatments',
  imports: [RouterLink, TranslatePipe, CurrencyFormatPipe, HasPermissionPipe, MatFormFieldModule, MatInputModule, MatSelectModule, MatTableModule, MatPaginatorModule, MatSortModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './treatments.html',
  styleUrl: './treatments.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Treatments implements OnInit {
  readonly Permission = Permission;
  private treatmentService = inject(TreatmentService);
  private confirmDialogService = inject(ConfirmDialogService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private paginator = viewChild(MatPaginator);
  private sort = viewChild(MatSort);

  categories = Object.values(TreatmentCategory);
  displayedColumns = ['code', 'name', 'category', 'defaultPrice', 'description', 'actions'];
  dataSource = new MatTableDataSource<Treatment>();
  searchQuery = signal('');
  categoryFilter = signal<string>('');

  filteredTreatments = computed(() => {
    return this.treatmentService.search(this.searchQuery(), {
      category: this.categoryFilter() || undefined,
    });
  });

  constructor() {
    effect(() => {
      const pag = this.paginator();
      const sort = this.sort();
      if (pag) this.dataSource.paginator = pag;
      if (sort) this.dataSource.sort = sort;
    });

    effect(() => {
      this.dataSource.data = this.filteredTreatments();
    });
  }

  ngOnInit(): void {
    this.treatmentService.loadAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  deleteTreatment(id: string): void {
    this.confirmDialogService
      .confirm('treatment.deleteTitle', 'treatment.deleteMessage')
      .pipe(
        // Before switchMap: cancels the dialog, never an in-flight delete.
        takeUntilDestroyed(this.destroyRef),
        filter(Boolean),
        switchMap(() => this.treatmentService.delete(id)),
      )
      .subscribe({
        next: () => this.toastService.success('toast.treatmentDeleted'),
        error: err => this.toastService.error(err),
      });
  }
}
