import { z } from 'zod';
import { BIRTHDAY_RELATIONSHIPS, CreateBirthdayRequest, UpdateBirthdayRequest } from '@birthday/shared-models';
import { birthDateSchema } from '@birthday/api-shared-validation';

// The same limits as the database checks. Lengths count characters as Postgres does, not UTF-16 code units.
const NAME_MAX = 200;
const NOTES_MAX = 500;

export const birthdayNameSchema = z
  .string()
  .transform((value: string) => value.trim())
  .refine((value: string) => value.length > 0 && [...value].length <= NAME_MAX, `Must have 1–${NAME_MAX} characters`);

const relationship = z.enum(BIRTHDAY_RELATIONSHIPS).nullable();

const notes = z
  .string()
  .refine((value: string) => [...value].length <= NOTES_MAX, `Must have at most ${NOTES_MAX} characters`)
  .nullable();

// Strict: fields the client may not set, such as the Google links, are rejected rather than ignored.
export const createBirthdaySchema = z.strictObject({
  name: birthdayNameSchema,
  birthDate: birthDateSchema,
  relationship: relationship.default(null),
  notes: notes.default(null),
}) satisfies z.ZodType<CreateBirthdayRequest>;

export const updateBirthdaySchema = z
  .strictObject({
    name: birthdayNameSchema.optional(),
    birthDate: birthDateSchema.optional(),
    relationship: relationship.optional(),
    notes: notes.optional(),
  })
  .refine((changes: object) => Object.keys(changes).length > 0, 'Must change at least one field') satisfies z.ZodType<UpdateBirthdayRequest>;
