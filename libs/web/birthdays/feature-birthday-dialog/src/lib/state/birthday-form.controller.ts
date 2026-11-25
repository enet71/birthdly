import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import {
  BirthdayDialogController,
  BirthdayDialogData,
  BirthdayDialogState,
  BirthdayFormModel,
  BirthdayInput,
  BirthdaysController,
} from '@birthday/web-birthdays-data-access';
import { injectState, ReadonlyState, StateController } from '@birthday/web-shared-data-access';
import { Birthday } from '@birthday/web-birthdays-util';

// Root-provided, so a save keeps running after the dialog closes; it loads with the dialog chunk.
@Injectable({ providedIn: 'root' })
export class BirthdayFormController extends StateController {
  private readonly birthdayDialogState: ReadonlyState<BirthdayDialogState> = injectState(BirthdayDialogState);
  private readonly birthdayDialogController: BirthdayDialogController = inject(BirthdayDialogController);
  private readonly birthdaysController: BirthdaysController = inject(BirthdaysController);

  public saveBirthday({ name, month, day, year, relationship, notes }: BirthdayFormModel): void {
    const dialog: BirthdayDialogData | null = this.birthdayDialogState.dialog();
    const isYearKnown: boolean = year !== '';
    // Without a year, a leap year keeps Feb 29; the year is then replaced by the unknown-year marker.
    const date: Date = new Date(isYearKnown ? Number(year) : 2000, month - 1, day);
    const input: BirthdayInput = { name, date, isYearKnown, relationship, notes };
    const save$: Observable<Birthday> = dialog?.birthday
      ? this.birthdaysController.updateBirthday(dialog.birthday.id, input)
      : this.birthdaysController.addBirthday(input);

    save$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.closeBirthdayDialogIfCurrent(dialog));
  }

  public deleteBirthday(): void {
    const dialog: BirthdayDialogData | null = this.birthdayDialogState.dialog();

    if (!dialog?.birthday) {
      return;
    }

    // Both storages emit once on success; a failed delete completes without emitting and keeps the dialog open.
    this.birthdaysController
      .deleteBirthday(dialog.birthday.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.closeBirthdayDialogIfCurrent(dialog));
  }

  // A slow request must not close a dialog the user opened after closing the one it started from.
  private closeBirthdayDialogIfCurrent(dialog: BirthdayDialogData | null): void {
    if (this.birthdayDialogState.dialog() === dialog) {
      this.birthdayDialogController.closeBirthdayDialog();
    }
  }
}
