import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AccountController, AccountState, AccountView } from '@birthday/web-auth-feature-account';
import { injectState, ReadonlyState } from '@birthday/web-shared-data-access';
import { AppTranslateService } from '@birthday/web-shared-i18n';
import { TranslocoPipe } from '@jsverse/transloco';
import { APP_COMPACT_LAYOUT_QUERY } from '../../app.constants';
import { AccountMenuController } from '../../state';
import { AccountAvatarComponent } from '../account-avatar';

// Opens the account menu: a dropdown on wide screens, a side sheet on narrow ones.
@Component({
  selector: 'app-account-button',
  imports: [TranslocoPipe, MatIcon, MatDivider, MatMenu, MatMenuItem, MatMenuTrigger, RouterLink, AccountAvatarComponent],
  providers: [AccountState, AccountController, AccountMenuController],
  templateUrl: './account-button.component.html',
  styleUrl: './account-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountButtonComponent {
  private readonly accountState: ReadonlyState<AccountState> = injectState(AccountState);
  private readonly accountController: AccountController = inject(AccountController);
  private readonly accountMenuController: AccountMenuController = inject(AccountMenuController);
  private readonly translator: AppTranslateService = inject(AppTranslateService);

  protected readonly isCompact: Signal<boolean> = toSignal(
    inject(BreakpointObserver)
      .observe(APP_COMPACT_LAYOUT_QUERY)
      .pipe(map((state: BreakpointState) => state.matches)),
    { initialValue: false },
  );
  protected readonly label: Signal<string> = computed(() => {
    const email: string = this.accountState.email();

    return email ? this.translator.translate('account.buttonSignedIn', { email }) : this.translator.translate('account.button');
  });

  protected get view(): Signal<AccountView> {
    return this.accountState.view;
  }

  protected get name(): Signal<string> {
    return this.accountState.name;
  }

  protected get email(): Signal<string> {
    return this.accountState.email;
  }

  protected get isPending(): Signal<boolean> {
    return this.accountState.isPending;
  }

  protected openAccountSheet(): void {
    this.accountMenuController.openAccountSheet();
  }

  protected runAccountAction(): void {
    if (this.view() === 'signedIn') {
      this.accountController.signOut();
    } else {
      this.accountController.signInWithGoogle();
    }
  }
}
