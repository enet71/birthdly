import { Route } from '@angular/router';
import { provideReminderScheduleDialog, ReminderSectionController, ReminderSectionState } from '@birthday/web-reminders-feature-settings';
import { SettingsComponent } from './settings.component';

export const SETTINGS_ROUTES: Route[] = [
  {
    path: '',
    component: SettingsComponent,
    providers: [ReminderSectionState, ReminderSectionController, provideReminderScheduleDialog()],
  },
];
