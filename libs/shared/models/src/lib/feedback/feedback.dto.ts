import { AppLocale } from '../i18n';

export const FEEDBACK_TYPES = ['bug', 'idea', 'other'] as const;

export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

// The same limit as the database check; it counts characters (code points) as Postgres does.
export const FEEDBACK_MESSAGE_MAX_LENGTH = 2000;

// The admin list returns at most this many of the newest messages.
export const FEEDBACK_ADMIN_LIST_LIMIT = 200;

// The same limit as the database check.
export const FEEDBACK_EMAIL_MAX_LENGTH = 254;

// Zod's default email rule, shared so the form accepts exactly what the API does; it requires a top-level domain.
export const FEEDBACK_EMAIL_PATTERN = /^(?:[A-Za-z0-9_'+-]+\.)*[A-Za-z0-9_'+-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/;

// A message sent through the feedback form, as the admin page lists it.
export interface FeedbackDto {
  id: string;
  type: FeedbackType;
  message: string;
  // The address to reply to; optional for the sender.
  email: string | null;
  // The interface language of the sender.
  locale: AppLocale;
  userAgent: string | null;
  // Set when the sender was signed in.
  userId: string | null;
  // ISO 8601 date and time.
  createdAt: string;
}
