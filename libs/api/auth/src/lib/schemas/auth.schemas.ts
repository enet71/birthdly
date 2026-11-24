import { z } from 'zod';
import { GoogleCodeSignInRequest, GoogleCredentialSignInRequest, UpdateProfileRequest } from '@birthday/shared-models';
import { birthDateSchema } from '@birthday/api-shared-validation';

// The same limit as the database check. Lengths count characters as Postgres does, not UTF-16 code units.
const DISPLAY_NAME_MAX = 200;

export const googleCodeSignInSchema = z.strictObject({ code: z.string().min(1).max(2048) }) satisfies z.ZodType<GoogleCodeSignInRequest>;

export const googleCredentialSignInSchema = z.strictObject({
  credential: z.string().min(1).max(8192),
}) satisfies z.ZodType<GoogleCredentialSignInRequest>;

// An empty name, after trimming, clears it, so the profile shows the Google name again.
const displayNameSchema = z
  .string()
  .transform((value: string) => value.trim() || null)
  .refine((value: string | null) => value === null || [...value].length <= DISPLAY_NAME_MAX, `Must have at most ${DISPLAY_NAME_MAX} characters`)
  .nullable();

export const updateProfileSchema = z
  .strictObject({
    displayName: displayNameSchema.optional(),
    birthDate: birthDateSchema.nullable().optional(),
  })
  .refine((changes: object) => Object.keys(changes).length > 0, 'Must change at least one field') satisfies z.ZodType<UpdateProfileRequest>;
