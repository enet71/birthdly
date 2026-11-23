import { sql } from 'drizzle-orm';
import { check, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

// A message sent through the feedback form; read by the admins. `user_id` is set when the sender was signed in, and
// deleting the account deletes the user's messages.
export const feedback = pgTable(
  'feedback',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    type: text('type', { enum: ['bug', 'idea', 'other'] }).notNull(),
    message: text('message').notNull(),
    email: text('email'),
    locale: text('locale', { enum: ['en', 'es', 'de', 'fr', 'ru', 'uk'] }).notNull(),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('feedback_user_id_idx').on(table.userId),
    index('feedback_created_at_idx').on(table.createdAt),
    check('feedback_type_check', sql`${table.type} in ('bug', 'idea', 'other')`),
    check('feedback_message_check', sql`length(trim(${table.message})) between 1 and 2000`),
    check('feedback_email_check', sql`length(${table.email}) <= 254`),
    check('feedback_locale_check', sql`${table.locale} in ('en', 'es', 'de', 'fr', 'ru', 'uk')`),
    check('feedback_user_agent_check', sql`length(${table.userAgent}) <= 500`),
  ],
);
