import { NgTemplateOutlet } from '@angular/common';
import { afterRenderEffect, ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS, MatSlideToggle } from '@angular/material/slide-toggle';
import { TranslocoPipe } from '@jsverse/transloco';
import { MAX_REMINDER_DAYS, MAX_REMINDERS, REMINDER_CHANNELS } from '@birthday/shared-models';
import { GoogleCalendarSectionController, GoogleCalendarSectionState } from '@birthday/web-google-calendar-feature-sync';
import { injectState } from '@birthday/web-shared-data-access';
import { LocaleDatePipe } from '@birthday/web-shared-i18n';
import { SettingsRowComponent } from '@birthday/web-shared-ui';
import { ReminderScheduleController, ReminderScheduleState } from '../../state';

@Component({
  selector: 'ui-reminder-schedule-dialog',
  imports: [
    MatButton,
    MatIconButton,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatFormField,
    MatLabel,
    MatIcon,
    MatInput,
    MatOption,
    MatSelect,
    MatSlideToggle,
    LocaleDatePipe,
    NgTemplateOutlet,
    SettingsRowComponent,
    TranslocoPipe,
  ],
  providers: [
    ReminderScheduleState,
    ReminderScheduleController,
    GoogleCalendarSectionState,
    GoogleCalendarSectionController,
    { provide: MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS, useValue: { disableToggleValue: true } },
  ],
  templateUrl: './reminder-schedule-dialog.component.html',
  styleUrl: './reminder-schedule-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReminderScheduleDialogComponent {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private editedIndex: number | null | undefined;
  protected readonly state = injectState(ReminderScheduleState);
  protected readonly controller = inject(ReminderScheduleController);
  protected readonly channels = REMINDER_CHANNELS;
  protected readonly maximumDays = MAX_REMINDER_DAYS;
  protected readonly maximumReminders = MAX_REMINDERS;

  constructor() {
    afterRenderEffect(() => {
      const index = this.state.draft()?.index;
      if (index === this.editedIndex) {
        return;
      }

      const host = this.element.nativeElement;

      if (index !== undefined) {
        host.querySelector<HTMLElement>('[data-reminder-days]')?.focus();
      } else {
        const row = host.querySelector<HTMLElement>(`[data-reminder-index="${this.editedIndex}"]`);
        (row ?? host.querySelector<HTMLElement>('[data-add-reminder]'))?.focus();
      }
      this.editedIndex = index;
    });
  }

  // The `HH:mm` value of a time input.
  protected time(minutes: number): string {
    if (!Number.isFinite(minutes)) {
      return '';
    }

    return [Math.floor(minutes / 60), minutes % 60].map((part) => String(part).padStart(2, '0')).join(':');
  }

  // A date at that time of day, so the template formats it for the user's locale.
  protected clockTime(minutes: number): Date {
    return new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60);
  }
}
