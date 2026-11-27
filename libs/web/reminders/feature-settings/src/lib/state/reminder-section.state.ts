import { Injectable, signal } from '@angular/core';
import { State } from '@birthday/web-shared-data-access';

@Injectable()
export class ReminderSectionState extends State {
  public readonly isScheduleDialogOpen = signal(false);

  public override resetState(): void {
    this.isScheduleDialogOpen.set(false);
  }
}
