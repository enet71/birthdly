import { z } from 'zod';
import {
  APP_LOCALES,
  CELEBRITY_OCCUPATIONS,
  CELEBRITY_SORTS,
  CELEBRITY_STATUSES,
  CelebritiesRequest,
  isCelebrityBirthYear,
} from '@birthday/shared-models';

// Far more values than any list has, so a request cannot grow without limit.
const LIST_MAX = 50;
// 2000 is a leap year, so February 29 exists.
const REFERENCE_YEAR = 2000;
// The page of a person far down a date; deeper offsets only cost the database.
const OFFSET_MAX = 10000;

// A comma-separated list, for example `occupations=film,music`; an empty value is an empty list.
function list<T extends z.ZodType>(item: T) {
  return z.preprocess(
    (value: unknown) => (value === undefined || value === '' ? [] : typeof value === 'string' ? value.split(',') : value),
    z.array(item).max(LIST_MAX),
  );
}

// Parameters of removed filters. Pages loaded before their removal still send them, so they are dropped, not answered with 400.
const REMOVED_PARAMS: ReadonlySet<string> = new Set(['decades']);

// Query parameters of `GET /api/celebrities`, as `toCelebritiesQueryParams` builds them. Strict: an unknown parameter is a
// mistake and answers 400.
const requestSchema = z
  .strictObject({
    month: z.coerce.number().int().min(1).max(12),
    day: z.coerce.number().int().min(1).max(31),
    locale: z.enum(APP_LOCALES).default('en'),
    countries: list(
      z
        .string()
        .regex(/^[a-z]{2}$/i, 'Must be an ISO 3166-1 alpha-2 code')
        .transform((code: string) => code.toUpperCase()),
    ),
    occupations: list(z.enum(CELEBRITY_OCCUPATIONS)),
    year: z.coerce.number().int().nullable().default(null),
    status: z.enum(CELEBRITY_STATUSES).default('all'),
    sort: z.enum(CELEBRITY_SORTS).default('popularity'),
    offset: z.coerce.number().int().min(0).max(OFFSET_MAX).default(0),
  })
  .refine(({ month, day }) => new Date(REFERENCE_YEAR, month - 1, day).getMonth() === month - 1, {
    message: 'Must be a day that exists in the month',
    path: ['day'],
  })
  .refine(({ month, day, year }) => year === null || isCelebrityBirthYear(year, month, day), {
    message: 'Must be a year from 1 to the current one in which the date exists',
    path: ['year'],
  })
  .transform(
    ({ countries, occupations, ...rest }): CelebritiesRequest => ({
      ...rest,
      countries: [...new Set(countries)],
      occupations: [...new Set(occupations)],
    }),
  );

export const celebritiesRequestSchema = z.preprocess(withoutRemovedParams, requestSchema);

function withoutRemovedParams(query: unknown): unknown {
  return query && typeof query === 'object'
    ? Object.fromEntries(Object.entries(query).filter(([key]: [string, unknown]) => !REMOVED_PARAMS.has(key)))
    : query;
}
