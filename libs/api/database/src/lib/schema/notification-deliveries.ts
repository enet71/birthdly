import { date, pgTable, primaryKey, smallint, text, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

// One claim per channel and scheduled minute of a local day. -1 is the legacy daily browser claim.
export const notificationDeliveries = pgTable(
  'notification_deliveries',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    localDate: date('local_date').notNull(),
    minuteOfDay: smallint('minute_of_day').notNull().default(-1),
    channel: text('channel', { enum: ['browser', 'email'] })
      .notNull()
      .default('browser'),
  },
  (table) => [
    primaryKey({ name: 'notification_deliveries_slot_channel_pk', columns: [table.userId, table.localDate, table.minuteOfDay, table.channel] }),
  ],
);
