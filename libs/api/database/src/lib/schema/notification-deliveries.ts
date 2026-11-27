import { date, pgTable, primaryKey, smallint, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

// One claim per scheduled minute of a local day. -1 is the legacy daily claim.
export const notificationDeliveries = pgTable(
  'notification_deliveries',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    localDate: date('local_date').notNull(),
    minuteOfDay: smallint('minute_of_day').notNull().default(-1),
  },
  (table) => [primaryKey({ columns: [table.userId, table.localDate, table.minuteOfDay] })],
);
