import { z } from 'zod';
import {
  APP_LOCALES,
  CreateFeedbackRequest,
  FEEDBACK_EMAIL_MAX_LENGTH,
  FEEDBACK_EMAIL_PATTERN,
  FEEDBACK_MESSAGE_MAX_LENGTH,
  FEEDBACK_TYPES,
} from '@birthday/shared-models';

// Lengths count characters as Postgres does, not UTF-16 code units.
const message = z
  .string()
  .transform((value: string) => value.trim())
  .refine(
    (value: string) => value.length > 0 && [...value].length <= FEEDBACK_MESSAGE_MAX_LENGTH,
    `Must have 1–${FEEDBACK_MESSAGE_MAX_LENGTH} characters`,
  )
  // Postgres text cannot hold NUL; without this check the insert fails with a 500.
  .refine((value: string) => !value.includes('\u0000'), 'Must not contain NUL characters');

// An empty field means the sender left no address.
const email = z
  .string()
  .trim()
  .transform((value: string) => value || null)
  .pipe(z.email({ pattern: FEEDBACK_EMAIL_PATTERN }).max(FEEDBACK_EMAIL_MAX_LENGTH).nullable())
  .nullable();

export const createFeedbackSchema = z.strictObject({
  type: z.enum(FEEDBACK_TYPES),
  message,
  email,
  locale: z.enum(APP_LOCALES),
  website: z.string().optional(),
}) satisfies z.ZodType<CreateFeedbackRequest>;
