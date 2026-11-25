import { effect, EnvironmentProviders, inject, provideEnvironmentInitializer, untracked } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BirthdayDialogController, BirthdayDialogData, BirthdayDialogState } from '@birthday/web-birthdays-data-access';
import { injectState, ReadonlyState } from '@birthday/web-shared-data-access';
import type { BirthdayDialogComponent } from './dialogs';

// Opens and closes the Birthday dialog from `BirthdayDialogState.dialog` over whatever page is shown. The dialog code
// loads on the first open, so it stays out of the initial bundle.
export function provideBirthdayDialog(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const birthdayDialogState: ReadonlyState<BirthdayDialogState> = injectState(BirthdayDialogState);
    const birthdayDialogController: BirthdayDialogController = inject(BirthdayDialogController);
    const dialog: MatDialog = inject(MatDialog);
    let dialogRef: MatDialogRef<BirthdayDialogComponent> | null = null;
    let isLoading = false;

    const openDialog = (component: typeof BirthdayDialogComponent): void => {
      // The state may have changed while the dialog code loaded.
      const data: BirthdayDialogData | null = birthdayDialogState.dialog();

      if (!data || dialogRef) {
        return;
      }

      dialogRef = dialog.open(component, {
        data,
        autoFocus: 'input',
        width: '32rem',
        maxWidth: 'calc(100vw - 2rem)',
      });
      dialogRef.afterClosed().subscribe(() => {
        dialogRef = null;
        birthdayDialogController.closeBirthdayDialog();
      });
    };

    effect(() => {
      const data: BirthdayDialogData | null = birthdayDialogState.dialog();

      untracked(() => {
        if (!data) {
          dialogRef?.close();
          return;
        }

        if (dialogRef || isLoading) {
          return;
        }

        isLoading = true;
        import('./dialogs').then(({ BirthdayDialogComponent }) => openDialog(BirthdayDialogComponent)).finally(() => (isLoading = false));
      });
    });
  });
}
