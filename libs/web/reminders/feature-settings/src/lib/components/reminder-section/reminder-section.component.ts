import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { SettingsRowComponent, SettingsSectionComponent } from '@birthday/web-shared-ui';
import { TranslocoPipe } from '@jsverse/transloco';
import { ReminderSectionController } from '../../state';

@Component({
  selector: 'ui-reminder-section',
  imports: [TranslocoPipe, MatButton, SettingsRowComponent, SettingsSectionComponent],
  templateUrl: './reminder-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReminderSectionComponent {
  private readonly sectionController = inject(ReminderSectionController);

  protected openSchedule(): void {
    this.sectionController.openScheduleDialog();
  }
}
