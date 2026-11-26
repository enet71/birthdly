import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatListItem, MatListItemIcon, MatListItemTitle, MatNavList } from '@angular/material/list';
import { RouterLink } from '@angular/router';
import { AccountController, AccountState, AccountView } from '@birthday/web-auth-feature-account';
import { injectState, ReadonlyState } from '@birthday/web-shared-data-access';
import { TranslocoPipe } from '@jsverse/transloco';
import { AccountAvatarComponent } from '../account-avatar';
import { LocalizedPathPipe } from '@birthday/web-shared-i18n';

// The account menu as a full-height side sheet on narrow screens; opened by `AccountMenuController`.
@Component({
  selector: 'app-account-sheet',
  imports: [
    LocalizedPathPipe,
    TranslocoPipe,
    RouterLink,
    MatButton,
    MatIconButton,
    MatDialogClose,
    MatIcon,
    MatNavList,
    MatListItem,
    MatListItemIcon,
    MatListItemTitle,
    AccountAvatarComponent,
  ],
  templateUrl: './account-sheet.component.html',
  styleUrl: './account-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSheetComponent {
  private readonly accountState: ReadonlyState<AccountState> = injectState(AccountState);
  private readonly accountController: AccountController = inject(AccountController);
  private readonly dialogRef: MatDialogRef<AccountSheetComponent> = inject(MatDialogRef);

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

  // Runs inside the click, so the Google sign-in popup is not blocked; the controllers outlive the sheet.
  protected runAccountAction(): void {
    if (this.view() === 'signedIn') {
      this.accountController.signOut();
    } else {
      this.accountController.signInWithGoogle();
    }
    this.dialogRef.close();
  }
}
