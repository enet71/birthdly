import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { AppLocale } from '@birthday/shared-models';
import { birthdays, DATABASE, Database, notificationDeliveries, pushSubscriptions } from '@birthday/api-database';
import { DueUser, NotifiedBirthday, StoredPushSubscription } from '../types';

// Deliveries are kept a week: long enough to cover every time zone's "today".
const DELIVERY_RETENTION_DAYS = 7;

interface DueUserRow extends Record<string, unknown> {
  user_id: string;
  local_date: string;
  delivery_date: string;
  minute_of_day: number;
  days_before: number[];
  locale: AppLocale;
}

// Who is due for a notification, and what it needs. The API connects as the database owner, so every query filters by
// the user itself.
@Injectable()
export class DueNotificationsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  public async forgetOldDeliveries(): Promise<void> {
    await this.db.delete(notificationDeliveries).where(sql`${notificationDeliveries.localDate} < current_date - ${DELIVERY_RETENTION_DAYS}::int`);
  }

  // A 119-minute grace period covers delayed jobs and the one-hour DST gap. The claim uses the scheduled local
  // date and minute, so repeated clock times and overlapping workers cannot send a slot twice. A slot whose time had
  // already come when the schedule was saved is skipped, so editing the schedule does not send a late reminder.
  public async claimDueUsers(limit: number): Promise<DueUser[]> {
    const result = await this.db.execute<DueUserRow>(sql`
      with slots as (
        select settings.user_id, settings.time_zone, settings.schedule_updated_at, local_clock.value::date - date_offset.days as local_date, local_clock.value::date as delivery_date, settings.locale,
          (entry.value->>'minuteOfDay')::int as minute_of_day, (entry.value->>'daysBefore')::int as days_before,
          extract(hour from local_clock.value)::int * 60 + extract(minute from local_clock.value)::int + date_offset.days * 1440 as current_minute
        from notification_settings settings
        join pg_catalog.pg_timezone_names zone on zone.name = settings.time_zone
        cross join lateral (select now() at time zone settings.time_zone as value) local_clock
        cross join generate_series(0, 1) date_offset(days)
        cross join lateral jsonb_array_elements(coalesce(settings.schedule, jsonb_build_array(
          jsonb_build_object('daysBefore', 0, 'minuteOfDay', settings.hour * 60, 'channels', jsonb_build_array('browser'), 'enabled', settings.remind_on_day),
          jsonb_build_object('daysBefore', 1, 'minuteOfDay', settings.hour * 60, 'channels', jsonb_build_array('browser'), 'enabled', settings.remind_day_before)
        ))) entry
        where (entry.value->>'enabled')::boolean and (entry.value->'channels') ? 'browser'
          and exists (select 1 from push_subscriptions subscription where subscription.user_id = settings.user_id)
      ),
      due as (
        select user_id, local_date, delivery_date, minute_of_day, locale, array_agg(days_before order by days_before) as days_before
        from slots
        where current_minute between minute_of_day and minute_of_day + 119
          and (schedule_updated_at is null
            or (local_date + make_interval(mins => minute_of_day)) at time zone time_zone > schedule_updated_at)
          and not exists (select 1 from notification_deliveries delivery
            where delivery.user_id = slots.user_id and delivery.local_date = slots.local_date
              and delivery.minute_of_day in (-1, slots.minute_of_day))
        group by user_id, local_date, delivery_date, minute_of_day, locale
        limit ${limit}
      ),
      claimed as (
        insert into notification_deliveries (user_id, local_date, minute_of_day)
        select user_id, local_date, minute_of_day from due
        on conflict do nothing
        returning user_id, local_date, minute_of_day
      )
      select due.user_id, to_char(due.local_date, 'YYYY-MM-DD') as local_date, to_char(due.delivery_date, 'YYYY-MM-DD') as delivery_date,
        due.minute_of_day, due.days_before, due.locale
      from due join claimed using (user_id, local_date, minute_of_day)
    `);

    return result.rows.map((row) => ({
      userId: row.user_id,
      localDate: row.local_date,
      deliveryDate: row.delivery_date,
      minuteOfDay: row.minute_of_day,
      daysBefore: row.days_before,
      locale: row.locale,
    }));
  }

  // Fetches birthdays for the configured offsets and includes leap-day birthdays for the final date match.
  public findBirthdaysAround(userId: string, localDate: string, offsets: number[]): Promise<NotifiedBirthday[]> {
    const targetDates = sql.join(
      offsets.map((days) => sql`to_char(${localDate}::date + ${days}::int, 'MM-DD')`),
      sql`, `,
    );
    return this.db
      .select({ name: birthdays.name, birthDate: birthdays.birthDate })
      .from(birthdays)
      .where(and(eq(birthdays.userId, userId), sql`to_char(${birthdays.birthDate}, 'MM-DD') in (${targetDates}, '02-29')`));
  }

  public findSubscriptions(userId: string): Promise<StoredPushSubscription[]> {
    return this.db
      .select({ id: pushSubscriptions.id, endpoint: pushSubscriptions.endpoint, p256dh: pushSubscriptions.p256dh, auth: pushSubscriptions.auth })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
  }

  public async deleteSubscription(id: string): Promise<void> {
    await this.db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id));
  }
}
