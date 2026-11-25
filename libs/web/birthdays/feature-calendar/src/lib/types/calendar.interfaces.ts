import { GoogleCalendarStatus } from '@birthday/web-google-calendar-data-access';
import { Birthday, UpcomingBirthday } from '@birthday/web-birthdays-util';

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  birthdays: Birthday[];
}

export interface CalendarMonth {
  date: Date;
  days: CalendarDay[];
}

export type CalendarView = 'month' | 'year';

export interface UpcomingCelebration extends UpcomingBirthday {
  age: number | null;
}

// The Google Calendar connection states in which the calendar invites the user to connect.
export type GoogleCalendarPrompt = Extract<GoogleCalendarStatus, 'disconnected' | 'revoked'>;
