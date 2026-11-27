import { ScheduledReminder } from '@birthday/shared-models';

// `blocked`: the user blocked notifications for the site. `enabled` and `disabled` describe this device.
export type BrowserReminderChannelView = 'loading' | 'error' | 'unsupported' | 'iosNotInstalled' | 'blocked' | 'disabled' | 'enabled';

export interface ReminderScheduleDraft {
  index: number | null;
  row: ScheduledReminder;
}
