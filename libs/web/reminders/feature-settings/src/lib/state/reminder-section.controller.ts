import { inject, Injectable } from '@angular/core';
import { StateController } from '@birthday/web-shared-data-access';
import { ReminderSectionState } from './reminder-section.state';

@Injectable()
export class ReminderSectionController extends StateController {
  private readonly sectionState = inject(ReminderSectionState);

  public openScheduleDialog(): void {
    this.sectionState.isScheduleDialogOpen.set(true);
  }

  public closeScheduleDialog(): void {
    this.sectionState.isScheduleDialogOpen.set(false);
  }
}
