import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DrizzleQueryError, eq, sql } from 'drizzle-orm';
import { fromDrizzle } from 'pg-boss';
import {
  AppLocale,
  googleCalendarReminderMinutes,
  ReminderDays,
  ReminderDevicePreferencesRequest,
  ReminderScheduleDto,
  ReminderSettingsDto,
  ScheduledReminder,
} from '@birthday/shared-models';
import { DATABASE, Database, googleCalendarConnections, notificationSettings } from '@birthday/api-database';
import { GoogleCalendarJobsService } from '@birthday/api-google-calendar';
import { TIME_ZONE_MESSAGE } from '../schemas';

const SETTINGS_COLUMNS = {
  remindOnDay: notificationSettings.remindOnDay,
  remindDayBefore: notificationSettings.remindDayBefore,
  hour: notificationSettings.hour,
  timeZone: notificationSettings.timeZone,
  locale: notificationSettings.locale,
};

const TIME_ZONE_CHECK = 'notification_settings_time_zone_check';

type SettingsRow = { remindOnDay: boolean; remindDayBefore: boolean; hour: number; timeZone: string; locale: AppLocale };

// One settings row per user; every query is limited to the signed-in user.
@Injectable()
export class ReminderSettingsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly googleJobs: GoogleCalendarJobsService,
  ) {}

  public async getSchedule(userId: string): Promise<ReminderScheduleDto> {
    const [row] = await this.db
      .select({
        ...SETTINGS_COLUMNS,
        schedule: notificationSettings.schedule,
      })
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, userId));
    if (row?.schedule) {
      return { reminders: row.schedule };
    }

    const [connection] = await this.db
      .select({ status: googleCalendarConnections.status })
      .from(googleCalendarConnections)
      .where(eq(googleCalendarConnections.userId, userId));
    const reminders: ScheduledReminder[] = [];

    // The same defaults as the fallback schedule in `DueNotificationsService.claimDueUsers`.
    if (row?.remindOnDay) {
      reminders.push({ daysBefore: 0, minuteOfDay: row.hour * 60, channels: ['browser'], enabled: true });
    }
    if (row?.remindDayBefore) {
      reminders.push({ daysBefore: 1, minuteOfDay: row.hour * 60, channels: ['browser'], enabled: true });
    }
    if (connection?.status === 'connected' || connection?.status === 'revoked') {
      const shared = reminders.find(({ daysBefore, minuteOfDay }) => daysBefore === 1 && minuteOfDay === 540);

      if (shared) {
        shared.channels.push('googleCalendar');
      } else {
        reminders.push({ daysBefore: 1, minuteOfDay: 540, channels: ['googleCalendar'], enabled: true });
      }
    }

    return { reminders };
  }

  public async saveSchedule(
    userId: string,
    schedule: ReminderScheduleDto,
    preferences: ReminderDevicePreferencesRequest,
  ): Promise<ReminderScheduleDto> {
    await this.db
      .transaction(async (tx) => {
        const [previous] = await tx
          .select({ schedule: notificationSettings.schedule })
          .from(notificationSettings)
          .where(eq(notificationSettings.userId, userId))
          .for('update');
        // The times are the ones the user sees, so the settings move to this device's time zone and the app's language.
        const changes = { ...preferences, schedule: schedule.reminders, scheduleUpdatedAt: sql`now()` };

        await tx
          .insert(notificationSettings)
          .values({ userId, ...changes })
          .onConflictDoUpdate({ target: notificationSettings.userId, set: changes });

        const before = googleCalendarReminderMinutes(previous?.schedule);
        const after = googleCalendarReminderMinutes(schedule.reminders);

        if (before.length === after.length && before.every((minutes, index) => minutes === after[index])) {
          return;
        }

        const [connection] = await tx
          .select({ status: googleCalendarConnections.status })
          .from(googleCalendarConnections)
          .where(eq(googleCalendarConnections.userId, userId));

        if (connection?.status === 'connected') {
          await this.googleJobs.enqueueReminderUpdate(userId, fromDrizzle(tx, sql));
        }
      })
      .catch(rejectUnknownTimeZone);

    return schedule;
  }

  // `null` when the user has never turned notifications on.
  public async get(userId: string): Promise<ReminderSettingsDto | null> {
    const [row] = await this.db.select(SETTINGS_COLUMNS).from(notificationSettings).where(eq(notificationSettings.userId, userId));

    return row ? toDto(row) : null;
  }

  // Creates the settings with the default days and hour, or keeps them; either way stores this device's time zone and
  // language.
  public async saveDevicePreferences(userId: string, preferences: ReminderDevicePreferencesRequest): Promise<ReminderSettingsDto> {
    const [row] = await this.db
      .insert(notificationSettings)
      .values({ userId, timeZone: preferences.timeZone, locale: preferences.locale })
      .onConflictDoUpdate({ target: notificationSettings.userId, set: { timeZone: preferences.timeZone, locale: preferences.locale } })
      .returning(SETTINGS_COLUMNS)
      .catch(rejectUnknownTimeZone);

    return toDto(row);
  }

  // Changes only the language of existing settings; without settings there is nothing to change.
  public async saveLocale(userId: string, locale: AppLocale): Promise<void> {
    await this.db.update(notificationSettings).set({ locale }).where(eq(notificationSettings.userId, userId));
  }
}

function toDto(row: SettingsRow): ReminderSettingsDto {
  return { days: toDays(row), hour: row.hour, timeZone: row.timeZone, locale: row.locale };
}

// The database keeps two flags, and a check makes sure at least one is on.
function toDays({ remindOnDay, remindDayBefore }: SettingsRow): ReminderDays {
  if (remindOnDay && remindDayBefore) {
    return 'both';
  }

  return remindOnDay ? 'onDay' : 'dayBefore';
}

// The time zone passed the JavaScript check but not Postgres's list, which is stricter, for example about letter case
// ("europe/berlin"). That is the client's mistake, so it gets the same 400 as any other invalid field.
function rejectUnknownTimeZone(error: unknown): never {
  const cause = error instanceof DrizzleQueryError ? error.cause : undefined;

  if (cause && 'constraint' in cause && cause.constraint === TIME_ZONE_CHECK) {
    throw new BadRequestException({
      statusCode: 400,
      message: 'The request is invalid',
      issues: [{ path: 'timeZone', message: TIME_ZONE_MESSAGE }],
    });
  }

  throw error;
}
