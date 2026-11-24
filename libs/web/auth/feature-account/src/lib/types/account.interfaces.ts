export type AccountView = 'loading' | 'signedOut' | 'signedIn';

// The status of a profile summary item; `loading` and `failed` show no value.
export type ProfileGoogleCalendarStatus = 'loading' | 'failed' | 'connected' | 'notConnected';
export type ProfileRemindersStatus = 'loading' | 'failed' | 'on' | 'off' | 'unsupported';

export interface ProfileBirthday {
  // The birth date; its year is the unknown-year marker when `hasYear` is false.
  date: Date;
  hasYear: boolean;
  // 0 on the birthday itself.
  daysUntil: number;
}

export interface ProfileFormModel {
  name: string;
  // 1–12, or `null` when the birthday is not set.
  month: number | null;
  day: number | null;
  // Empty when the birth year is unknown.
  year: string;
}
