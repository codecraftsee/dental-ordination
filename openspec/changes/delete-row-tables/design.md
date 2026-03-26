## Design

### Pattern Reference

The implementation follows the **exact** pattern already used in `diagnoses.ts` and `treatments.ts`:

```typescript
// Component method
deleteEntity(id: string): void {
  this.confirmDialogService
    .confirm('entity.deleteTitle', 'entity.deleteMessage')
    .subscribe(confirmed => {
      if (confirmed) {
        this.entityService.delete(id).subscribe();
      }
    });
}
```

```html
<!-- Template: button in actions column -->
<button mat-icon-button class="icon-btn--danger" (click)="deleteEntity(row.id)">
  <mat-icon>delete</mat-icon>
</button>
```

### Dependencies Already in Place

| Dependency | Status |
|---|---|
| `ConfirmDialogService` | Exists in `services/confirm-dialog.service.ts` |
| `PatientService.delete()` | Exists — optimistically updates signal cache |
| `VisitService.delete()` | Exists — optimistically updates signal cache |
| Translation keys (`patient.deleteTitle`, etc.) | Exist in `en.json` and `sr.json` |
| `icon-btn--danger` CSS class | Already used in diagnoses/treatments |

### Data Flow

1. User clicks delete icon on a table row
2. `ConfirmDialogService.confirm()` opens modal with translated title/message
3. If confirmed → service `delete(id)` fires HTTP DELETE
4. Service `tap()` removes item from signal cache → table reactively updates
5. If cancelled → no action

### No Pagination Reset Needed

The `MatTableDataSource` is bound to a computed signal. When the signal cache updates (item removed), the computed re-evaluates and the table refreshes automatically. Pagination adjusts naturally.
