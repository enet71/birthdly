import { Injectable, signal, WritableSignal } from '@angular/core';
import { State } from '@birthday/web-shared-data-access';
import { BirthdayDialogData } from '../../types';

// App-wide, so the Add birthday dialog opens over any page.
@Injectable({ providedIn: 'root' })
export class BirthdayDialogState extends State {
  public readonly dialog: WritableSignal<BirthdayDialogData | null> = signal(null);
  // A sign-in started from the dialog to add a photo.
  public readonly isSigningIn: WritableSignal<boolean> = signal(false);

  public override resetState(): void {
    this.dialog.set(null);
    this.isSigningIn.set(false);
  }
}
