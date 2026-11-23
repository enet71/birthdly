import { FeedbackType } from '@birthday/shared-models';

export interface FeedbackFormModel {
  // Null until the sender picks one.
  type: FeedbackType | null;
  message: string;
  // Empty when the sender leaves no address.
  email: string;
  // The honeypot; people never see it.
  website: string;
}
