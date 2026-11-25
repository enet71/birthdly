import { inject, Injectable } from '@angular/core';
import { parseISO, startOfToday } from 'date-fns';
import { StateController } from '@birthday/web-shared-data-access';
import { Birthday } from '@birthday/web-birthdays-util';
import { BirthdayDialogState } from './birthday-dialog.state';

// Created at app start, so it only opens and closes the dialog; saving lives with the lazily loaded dialog.
@Injectable({ providedIn: 'root' })
export class BirthdayDialogController extends StateController {
  private readonly birthdayDialogState: BirthdayDialogState = inject(BirthdayDialogState);

  public openAddBirthdayDialog(date: Date = startOfToday()): void {
    this.birthdayDialogState.dialog.set({ date });
  }

  public openEditBirthdayDialog(birthday: Birthday): void {
    this.birthdayDialogState.dialog.set({ date: parseISO(birthday.birthDate), birthday });
  }

  public closeBirthdayDialog(): void {
    this.birthdayDialogState.dialog.set(null);
  }
}
