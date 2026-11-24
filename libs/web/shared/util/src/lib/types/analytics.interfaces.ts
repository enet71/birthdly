// The key events sent to Umami. Page views are tracked automatically.
export type AnalyticsEvent =
  | 'sign_in'
  | 'birthday_added'
  | 'birthday_deleted'
  | 'google_calendar_connected'
  | 'google_calendar_disconnected'
  | 'push_reminders_enabled'
  | 'push_reminders_disabled'
  | 'feedback_sent'
  | 'invite_link_copied'
  | 'invite_link_shared'
  | 'invite_submission_approved'
  | 'invite_submitted';

export type AnalyticsEventData = Record<string, string | number | boolean>;
