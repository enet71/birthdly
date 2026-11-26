import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable } from 'rxjs';
import { AuthState } from '@birthday/web-auth-data-access';
import {
  BirthdayDialogController,
  BirthdayDialogData,
  BirthdayDialogState,
  BirthdayFormModel,
  BirthdayInput,
  BirthdayPhotoChange,
  BirthdaysController,
} from '@birthday/web-birthdays-data-access';
import { injectState, ReadonlyState, StateController } from '@birthday/web-shared-data-access';
import { Birthday } from '@birthday/web-birthdays-util';

// Root-provided, so a save keeps running after the dialog closes; it loads with the dialog chunk.
@Injectable({ providedIn: 'root' })
export class BirthdayFormController extends StateController {
  private readonly birthdayDialogState: ReadonlyState<BirthdayDialogState> = injectState(BirthdayDialogState);
  private readonly authState: ReadonlyState<AuthState> = injectState(AuthState);
  private readonly birthdayDialogController: BirthdayDialogController = inject(BirthdayDialogController);
  private readonly birthdaysController: BirthdaysController = inject(BirthdaysController);

  // The dialog closes once the birthday is saved; the photo uploads after that, and a failed upload only shows an error.
  public saveBirthday({ name, month, day, year, relationship, notes }: BirthdayFormModel, photoChange: BirthdayPhotoChange): void {
    const dialog: BirthdayDialogData | null = this.birthdayDialogState.dialog();
    const isYearKnown: boolean = year !== '';
    // Without a year, a leap year keeps Feb 29; the year is then replaced by the unknown-year marker.
    const date: Date = new Date(isYearKnown ? Number(year) : 2000, month - 1, day);
    const input: BirthdayInput = { name, date, isYearKnown, relationship, notes };
    const save$: Observable<Birthday> = dialog?.birthday
      ? this.birthdaysController.updateBirthday(dialog.birthday.id, input)
      : this.birthdaysController.addBirthday(input);

    save$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((birthday: Birthday) => {
      this.birthdayDialogController.closeBirthdayDialogIfCurrent(dialog);
      this.savePhoto(birthday, photoChange).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    });
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
      .subscribe(() => this.birthdayDialogController.closeBirthdayDialogIfCurrent(dialog));
  }

  public signInToAddPhoto(): void {
    this.birthdayDialogController.signInToAddPhoto();
  }

  // Local birthdays have no photos.
  private savePhoto({ id }: Birthday, change: BirthdayPhotoChange): Observable<Birthday> {
    if (!this.authState.isAuthenticated()) {
      return EMPTY;
    }

    switch (change.kind) {
      case 'file':
        return this.birthdaysController.setPhoto(id, change.image);
      case 'url':
        return this.birthdaysController.setPhotoFromUrls(id, change.sourceUrls);
      case 'remove':
        return this.birthdaysController.removePhoto(id);
      default:
        return EMPTY;
    }
  }
}
