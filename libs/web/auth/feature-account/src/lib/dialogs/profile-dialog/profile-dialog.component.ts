import { ChangeDetectionStrategy, Component, computed, inject, signal, Signal, WritableSignal } from '@angular/core';
import { disabled, FieldTree, form, FormField, pattern, required, submit, validate } from '@angular/forms/signals';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatError, MatFormField, MatHint, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { getDaysInMonth, parseISO } from 'date-fns';
import { AuthState } from '@birthday/web-auth-data-access';
import { hasBirthYear } from '@birthday/web-birthdays-util';
import { injectState, ReadonlyState } from '@birthday/web-shared-data-access';
import { LocaleDatePipe } from '@birthday/web-shared-i18n';
import { DialogHeaderComponent } from '@birthday/web-shared-ui';
import { TranslocoPipe } from '@jsverse/transloco';
import { ProfileController, ProfileState } from '../../state';
import { ProfileFormModel } from '../../types';

// A leap year, so Feb 29 can be chosen while the birth year is empty.
const ANY_LEAP_YEAR = 2000;
// The same limit as the database check.
const DISPLAY_NAME_MAX_LENGTH = 200;

// Opened by `ProfileController`; edits the name and the user's own birthday.
@Component({
  selector: 'ui-profile-dialog',
  imports: [
    TranslocoPipe,
    LocaleDatePipe,
    FormField,
    MatButton,
    MatIconButton,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatError,
    MatFormField,
    MatHint,
    MatLabel,
    MatPrefix,
    MatIcon,
    MatInput,
    MatOption,
    MatSelect,
    DialogHeaderComponent,
  ],
  templateUrl: './profile-dialog.component.html',
  styleUrl: './profile-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileDialogComponent {
  private readonly authState: ReadonlyState<AuthState> = injectState(AuthState);
  private readonly profileState: ReadonlyState<ProfileState> = injectState(ProfileState);
  private readonly profileController: ProfileController = inject(ProfileController);

  protected readonly months: Date[] = Array.from({ length: 12 }, (_, index: number) => new Date(ANY_LEAP_YEAR, index));
  protected readonly googleName: string = this.authState.user()?.name ?? '';
  protected readonly model: WritableSignal<ProfileFormModel> = signal(this.createModel());
  protected readonly days: Signal<number[]> = computed(() => this.listDays(this.model().month));
  // Error messages are translation keys; the template translates them.
  protected readonly profileForm: FieldTree<ProfileFormModel> = form(this.model, (path) => {
    // Counted as the API does: after trimming, in characters rather than UTF-16 code units.
    validate(path.name, ({ value }) =>
      [...value().trim()].length > DISPLAY_NAME_MAX_LENGTH ? { kind: 'nameTooLong', message: 'profile.dialog.errors.nameTooLong' } : undefined,
    );
    // Without a month there is no birthday, so the day and year wait for it.
    disabled(path.day, ({ valueOf }) => valueOf(path.month) === null);
    disabled(path.year, ({ valueOf }) => valueOf(path.month) === null);
    required(path.day, { when: ({ valueOf }) => valueOf(path.month) !== null, message: 'profile.dialog.errors.dayRequired' });
    pattern(path.year, /^([1-9]\d{3})?$/, { message: 'birthdayDialog.errors.yearFormat' });
    validate(path.year, ({ value }) =>
      Number(value()) > new Date().getFullYear() ? { kind: 'futureYear', message: 'birthdayDialog.errors.futureYear' } : undefined,
    );
    // Picking a shorter month keeps the chosen day, and Feb 29 exists only in leap years.
    validate(path.day, ({ value, valueOf }) => {
      const day: number | null = value();
      const month: number | null = valueOf(path.month);
      const year: string = valueOf(path.year);

      if (day === null || month === null) {
        return undefined;
      }

      const daysInMonth: number = getDaysInMonth(new Date(/^\d{4}$/.test(year) ? Number(year) : ANY_LEAP_YEAR, month - 1));

      return day > daysInMonth ? { kind: 'invalidDay', message: 'birthdayDialog.errors.invalidDay' } : undefined;
    });
  });

  protected get isSaving(): Signal<boolean> {
    return this.profileState.isSaving;
  }

  protected save(event: Event): void {
    event.preventDefault();
    // `submit` requires a Promise-returning action; saving itself stays an Observable.
    submit(this.profileForm, async () => this.profileController.saveProfile(this.model()));
  }

  private listDays(month: number | null): number[] {
    const count: number = month === null ? 31 : getDaysInMonth(new Date(ANY_LEAP_YEAR, month - 1));

    return Array.from({ length: count }, (_, index: number) => index + 1);
  }

  private createModel(): ProfileFormModel {
    const birthDate: string | null = this.authState.user()?.birthDate ?? null;
    const date: Date | null = birthDate ? parseISO(birthDate) : null;

    return {
      name: this.authState.user()?.displayName ?? '',
      month: date ? date.getMonth() + 1 : null,
      day: date ? date.getDate() : null,
      year: birthDate && date && hasBirthYear(birthDate) ? String(date.getFullYear()) : '',
    };
  }
}
