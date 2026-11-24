import { effect, inject, Injectable, Injector, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { finalize, from } from 'rxjs';
import { UpdateProfileRequest } from '@birthday/shared-models';
import { AuthController, AuthState } from '@birthday/web-auth-data-access';
import { toBirthDate } from '@birthday/web-birthdays-util';
import { GoogleCalendarController } from '@birthday/web-google-calendar-data-access';
import { RemindersController } from '@birthday/web-reminders-data-access';
import { injectState, ReadonlyState, StateController } from '@birthday/web-shared-data-access';
import { AppTranslateService } from '@birthday/web-shared-i18n';
import type { ProfileDialogComponent } from '../dialogs';
import { ProfileFormModel } from '../types';
import { ProfileState } from './profile.state';

// A leap year, so Feb 29 can be saved while the birth year is empty.
const ANY_LEAP_YEAR = 2000;

// Provided by the profile route next to `ProfileState`.
@Injectable()
export class ProfileController extends StateController {
  private readonly profileState: ProfileState = inject(ProfileState);
  private readonly authState: ReadonlyState<AuthState> = injectState(AuthState);
  private readonly authController: AuthController = inject(AuthController);
  private readonly dialog: MatDialog = inject(MatDialog);
  // The dialog injects this route-scoped controller.
  private readonly injector: Injector = inject(Injector);
  private readonly translator: AppTranslateService = inject(AppTranslateService);
  private dialogRef: MatDialogRef<ProfileDialogComponent> | null = null;

  constructor() {
    super();
    // The summary reloads on every entry to the page, which also retries a failed load.
    inject(GoogleCalendarController).reloadConnection();
    inject(RemindersController).reload();
    // Signing out while the dialog is open closes it: there is no profile to edit any more.
    effect(() => {
      if (!this.authState.isAuthenticated()) {
        untracked(() => this.closeProfileDialog());
      }
    });
  }

  // The dialog loads on first use: the account menu imports this library, so a static import would put the dialog and
  // its form fields into the initial bundle.
  public openProfileDialog(): void {
    from(import('../dialogs'))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ ProfileDialogComponent: component }) => this.showProfileDialog(component));
  }

  public closeProfileDialog(): void {
    this.dialogRef?.close();
  }

  // Closes the dialog once saved; a failure is reported by `AuthController` and keeps the dialog open.
  public saveProfile(model: ProfileFormModel): void {
    if (this.profileState.isSaving()) {
      return;
    }

    this.profileState.isSaving.set(true);
    this.authController
      .updateProfile(toUpdateProfileRequest(model))
      .pipe(
        finalize(() => this.profileState.isSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.closeProfileDialog());
  }

  public override resetState(): void {
    this.closeProfileDialog();
  }

  private showProfileDialog(component: typeof ProfileDialogComponent): void {
    if (this.dialogRef) {
      return;
    }

    this.dialogRef = this.dialog.open(component, {
      injector: this.injector,
      ariaLabel: this.translator.translate('profile.dialog.title'),
      autoFocus: 'input',
      width: '32rem',
      maxWidth: 'calc(100vw - 2rem)',
    });
    this.dialogRef.afterClosed().subscribe(() => (this.dialogRef = null));
  }
}

function toUpdateProfileRequest({ name, month, day, year }: ProfileFormModel): UpdateProfileRequest {
  const isYearKnown: boolean = year !== '';
  // An empty name returns to the name from Google.
  const displayName: string | null = name.trim() || null;
  const birthDate: string | null =
    month && day ? toBirthDate(new Date(isYearKnown ? Number(year) : ANY_LEAP_YEAR, month - 1, day), isYearKnown) : null;

  return { displayName, birthDate };
}
