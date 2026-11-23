import { FeedbackType } from '@birthday/shared-models';

// The admin pages are English only.
export const ADMIN_FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  bug: 'Bug',
  idea: 'Idea',
  other: 'Other',
};

export const ADMIN_FEEDBACK_DATE_FORMAT = 'yyyy-MM-dd HH:mm';
