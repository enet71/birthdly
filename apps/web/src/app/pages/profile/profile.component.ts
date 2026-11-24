import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import {
  AccountController,
  AccountState,
  AccountView,
  ProfileBirthday,
  ProfileController,
  ProfileGoogleCalendarStatus,
  ProfileRemindersStatus,
  ProfileState,
} from '@birthday/web-auth-feature-account';
import { injectState, ReadonlyState } from '@birthday/web-shared-data-access';
import { AppTranslateService, LocaleDatePipe } from '@birthday/web-shared-i18n';
import { TranslocoPipe } from '@jsverse/transloco';
import { AccountAvatarComponent } from '../../components/account-avatar';

// `ProfileState` and `ProfileController` come from the route; the account view and sign-in from this page.
@Component({
  selector: 'app-profile',
  imports: [TranslocoPipe, LocaleDatePipe, RouterLink, MatButton, MatIcon, MatProgressSpinner, AccountAvatarComponent],
  providers: [AccountState, AccountController],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly accountState: ReadonlyState<AccountState> = injectState(AccountState);
  private readonly accountController: AccountController = inject(AccountController);
  private readonly profileState: ReadonlyState<ProfileState> = injectState(ProfileState);
  private readonly profileController: ProfileController = inject(ProfileController);
  private readonly translator: AppTranslateService = inject(AppTranslateService);

  protected get view(): Signal<AccountView> {
    return this.accountState.view;
  }

  protected get name(): Signal<string> {
    return this.accountState.name;
  }

  protected get email(): Signal<string> {
    return this.accountState.email;
  }

  protected get isAdmin(): Signal<boolean> {
    return this.accountState.isAdmin;
  }

  protected get isPending(): Signal<boolean> {
    return this.accountState.isPending;
  }

  protected get birthday(): Signal<ProfileBirthday | null> {
    return this.profileState.birthday;
  }

  protected get memberSince(): Signal<Date | null> {
    return this.profileState.memberSince;
  }

  protected get googleCalendarStatus(): Signal<ProfileGoogleCalendarStatus> {
    return this.profileState.googleCalendarStatus;
  }

  protected get remindersStatus(): Signal<ProfileRemindersStatus> {
    return this.profileState.remindersStatus;
  }

  protected runAccountAction(): void {
    if (this.view() === 'signedIn') {
      this.accountController.signOut();
    } else {
      this.accountController.signInWithGoogle();
    }
  }

  protected openProfileDialog(): void {
    this.profileController.openProfileDialog();
  }

  protected countdown(daysUntil: number): string {
    if (daysUntil === 0) {
      return this.translator.translate('profile.birthday.today');
    }

    return daysUntil === 1 ? this.translator.translate('calendar.tomorrow') : this.translator.translatePlural('calendar.inDays', daysUntil);
  }
}
