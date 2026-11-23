import { FeedbackDto } from './feedback.dto';

export interface CreateFeedbackRequest extends Pick<FeedbackDto, 'type' | 'message' | 'email' | 'locale'> {
  // A honeypot: the form hides it from people, so only bots fill it in. The API drops such messages silently.
  website?: string;
}
