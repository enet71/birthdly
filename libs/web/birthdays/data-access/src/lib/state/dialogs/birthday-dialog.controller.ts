import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { parseISO, startOfToday } from 'date-fns';
import { finalize } from 'rxjs';
import { AuthController, AuthState } from '@birthday/web-auth-data-access';
import { injectState, ReadonlyState, StateController } from '@birthday/web-shared-data-access';
import { Birthday } from '@birthday/web-birthdays-util';
import { BirthdayDialogData, BirthdayDialogDraft } from '../../types';
import { BirthdayDialogState } from './birthday-dialog.state';

// Created at app start, so it only opens and closes the dialog; saving lives with the lazily loaded dialog.
@Injectable({ providedIn: 'root' })
export class BirthdayDialogController extends StateController {
  private readonly birthdayDialogState: BirthdayDialogState = inject(BirthdayDialogState);
  private readonly authState: ReadonlyState<AuthState> = injectState(AuthState);
  private readonly authController: AuthController = inject(AuthController);

  public openAddBirthdayDialog(date: Date = startOfToday()): void {
    this.birthdayDialogState.dialog.set({ date });
  }

  // Every field of the draft stays editable; saving adds a new birthday.
  public openAddBirthdayDialogWithDraft(draft: BirthdayDialogDraft): void {
    this.birthdayDialogState.dialog.set({ date: parseISO(draft.birthDate), draft });
  }

  public openEditBirthdayDialog(birthday: Birthday): void {
    this.birthdayDialogState.dialog.set({ date: parseISO(birthday.birthDate), birthday });
  }

  public closeBirthdayDialog(): void {
    this.birthdayDialogState.dialog.set(null);
  }

  // A slow request must not close a dialog the user opened after closing the one it started from.
  public closeBirthdayDialogIfCurrent(dialog: BirthdayDialogData | null): void {
    if (this.birthdayDialogState.dialog() === dialog) {
      this.closeBirthdayDialog();
    }
  }

  // Photos need an account. Call it while handling the click: it opens the Google popup. The Add dialog stays open with
  // what was entered; an edited birthday was a local one, which the sign-in moves into the account under a new id, so
  // its dialog closes.
  public signInToAddPhoto(): void {
    const dialog: BirthdayDialogData | null = this.birthdayDialogState.dialog();

    if (this.birthdayDialogState.isSigningIn()) {
      return;
    }
    this.birthdayDialogState.isSigningIn.set(true);
    this.authController
      .signInWithGoogle()
      .pipe(
        finalize(() => this.birthdayDialogState.isSigningIn.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        complete: () => {
          if (this.authState.isAuthenticated() && dialog?.birthday) {
            this.closeBirthdayDialogIfCurrent(dialog);
          }
        },
      });
  }
}
