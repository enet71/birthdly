import { sql } from 'drizzle-orm';
import { check, date, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// A person who signed in with Google. `google_sub` is Google's stable account id; the email can change.
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    googleSub: text('google_sub').notNull().unique(),
    email: text('email').notNull(),
    // The name from the Google account, refreshed on every sign-in.
    name: text('name'),
    // The name the user set in the profile; shown instead of `name` when set. Sign-in never changes it.
    displayName: text('display_name'),
    // The address of the Google profile picture, refreshed on every sign-in.
    picture: text('picture'),
    // The user's own birthday, `yyyy-MM-dd`; the year 0004 marks an unknown birth year.
    birthDate: date('birth_date'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [check('users_display_name_check', sql`length(trim(${table.displayName})) between 1 and 200`)],
);
