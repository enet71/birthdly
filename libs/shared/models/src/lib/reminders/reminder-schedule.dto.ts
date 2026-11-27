export const REMINDER_CHANNELS = ['browser', 'googleCalendar'] as const;
export const MAX_REMINDERS = 5;
export const MAX_REMINDER_DAYS = 28;
export const MINUTES_PER_DAY = 24 * 60;

export type ReminderChannel = (typeof REMINDER_CHANNELS)[number];

export interface ScheduledReminder {
  daysBefore: number;
  minuteOfDay: number;
  channels: ReminderChannel[];
  enabled: boolean;
}

export interface ReminderScheduleDto {
  reminders: ScheduledReminder[];
}

// Minutes before the start of an all-day Google event. Google cannot remind after the event starts, so a same-day
// reminder fires at midnight. Without a schedule, Google keeps the original reminder at 9:00 the day before.
export function googleCalendarReminderMinutes(schedule: ScheduledReminder[] | null | undefined): number[] {
  if (!schedule) {
    return [MINUTES_PER_DAY - 9 * 60];
  }

  const minutes = schedule
    .filter((row) => row.enabled && row.channels.includes('googleCalendar'))
    .map((row) => Math.max(0, row.daysBefore * MINUTES_PER_DAY - row.minuteOfDay));

  return [...new Set(minutes)].sort((a, b) => a - b);
}
