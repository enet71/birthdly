import { effect, EnvironmentProviders, inject, Injector, provideEnvironmentInitializer, untracked } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { injectState, ReadonlyState } from '@birthday/web-shared-data-access';
import { ReminderScheduleDialogComponent } from './dialogs';
import { ReminderSectionController, ReminderSectionState } from './state';

// Opens and closes the reminder schedule dialog from `ReminderSectionState.isScheduleDialogOpen`.
export function provideReminderScheduleDialog(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const sectionState: ReadonlyState<ReminderSectionState> = injectState(ReminderSectionState);
    const sectionController: ReminderSectionController = inject(ReminderSectionController);
    const dialog: MatDialog = inject(MatDialog);
    const injector: Injector = inject(Injector);
    let dialogRef: MatDialogRef<ReminderScheduleDialogComponent> | null = null;

    effect(() => {
      const isOpen: boolean = sectionState.isScheduleDialogOpen();

      untracked(() => {
        if (!isOpen) {
          dialogRef?.close();
          return;
        }

        if (dialogRef) {
          return;
        }

        dialogRef = dialog.open(ReminderScheduleDialogComponent, {
          injector,
          width: '40rem',
          maxWidth: 'calc(100vw - 2rem)',
        });
        dialogRef.afterClosed().subscribe(() => {
          dialogRef = null;
          sectionController.closeScheduleDialog();
        });
      });
    });
  });
}
