import { z } from 'zod';

// `yyyy-MM-dd`; the year 0004 marks an unknown birth year, so 0004-02-29 is valid.
export const birthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a date in the yyyy-MM-dd format')
  .refine(isCalendarDate, 'Must be a date that exists');

function isCalendarDate(value: string): boolean {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);

  // setUTCFullYear, unlike Date.UTC, keeps years below 100 as they are.
  date.setUTCFullYear(year, month - 1, day);
  return year >= 1 && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
