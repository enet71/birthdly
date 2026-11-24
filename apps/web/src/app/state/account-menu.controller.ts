import { inject, Injectable, Injector } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { StateController } from '@birthday/web-shared-data-access';
import { AppTranslateService } from '@birthday/web-shared-i18n';
import { AccountSheetComponent } from '../components/account-sheet';

// Provided by the account button next to `AccountState` and `AccountController`. The sheet gets the button's injector,
// so it shares them, and a sign-in started from the sheet keeps running after the sheet closes.
@Injectable()
export class AccountMenuController extends StateController {
  private readonly dialog: MatDialog = inject(MatDialog);
  private readonly injector: Injector = inject(Injector);
  private readonly translator: AppTranslateService = inject(AppTranslateService);
  private sheetRef: MatDialogRef<AccountSheetComponent> | null = null;

  public openAccountSheet(): void {
    if (this.sheetRef) {
      return;
    }

    this.sheetRef = this.dialog.open(AccountSheetComponent, {
      injector: this.injector,
      ariaLabel: this.translator.translate('account.button'),
      autoFocus: 'dialog',
      panelClass: 'app-side-sheet',
      position: { top: '0', right: '0' },
      width: 'min(85vw, 20rem)',
      maxWidth: '100vw',
      height: '100%',
      maxHeight: '100%',
      enterAnimationDuration: 0,
    });
    this.sheetRef.afterClosed().subscribe(() => (this.sheetRef = null));
  }

  public override resetState(): void {
    this.sheetRef?.close();
  }
}
