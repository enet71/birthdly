import type { Mock } from 'vitest';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { birthdays, DATABASE, Database, DatabaseModule, users } from '@birthday/api-database';
import { MODULE_OPTIONS_TOKEN } from '../google-calendar.module-definition';
import { GoogleCalendarModuleOptions } from '../types';
import { GoogleApiClient } from './google-api.client';
import { GoogleCalendarEventsService } from './google-calendar-events.service';
import { GoogleConnectionsService } from './google-connections.service';

const CONTAINER_TIMEOUT_MS = 120_000;
const MIGRATIONS_FOLDER = join(import.meta.dirname, '../../../../database/migrations');
const ACCESS_TOKEN = 'access-token';
const BIRTHDAY_EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const DEV_TAG = 'dev';

describe('GoogleCalendarEventsService with a real Postgres', () => {
  let container: StartedPostgreSqlContainer;
  let databaseModule: TestingModule;
  let db: Database;
  // The ids of the events Google lists for the user.
  let googleEventIds: string[];

  const api: { request: Mock<GoogleApiClient['request']> } = { request: vi.fn() };
  const connections: {
    isConnected: Mock<GoogleConnectionsService['isConnected']>;
    markSynced: Mock<GoogleConnectionsService['markSynced']>;
  } = {
    isConnected: vi.fn(),
    markSynced: vi.fn(),
  };

  beforeAll(async () => {
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    container = await new PostgreSqlContainer('postgres:17-alpine').start();
    databaseModule = await Test.createTestingModule({
      imports: [DatabaseModule.forRoot({ connectionString: container.getConnectionUri(), migrationsFolder: MIGRATIONS_FOLDER })],
    }).compile();
    await databaseModule.init();

    db = databaseModule.get<Database>(DATABASE);
  }, CONTAINER_TIMEOUT_MS);

  afterAll(async () => {
    await databaseModule?.close();
    await container?.stop();
    vi.restoreAllMocks();
  }, CONTAINER_TIMEOUT_MS);

  beforeEach(() => {
    vi.clearAllMocks();
    googleEventIds = [];
    connections.isConnected.mockResolvedValue(true);
    connections.markSynced.mockResolvedValue(undefined);
    api.request.mockImplementation(async (_accessToken: string, method: string, _url: string, body?: unknown) => {
      switch (method) {
        case 'GET':
          return { items: googleEventIds.map((id) => ({ id, status: 'confirmed' })) };
        case 'POST':
        case 'PUT':
          return { ...(body as Record<string, unknown>), status: 'confirmed' };
        default:
          return {};
      }
    });
  });

  // Each installation is a service with its own event id tag over the same database.
  async function createService(eventIdTag: string): Promise<GoogleCalendarEventsService> {
    const moduleRef = await Test.createTestingModule({
      providers: [
        GoogleCalendarEventsService,
        { provide: DATABASE, useValue: db },
        { provide: MODULE_OPTIONS_TOKEN, useValue: { eventIdTag } as GoogleCalendarModuleOptions },
        { provide: GoogleApiClient, useValue: api },
        { provide: GoogleConnectionsService, useValue: connections },
      ],
    }).compile();

    return moduleRef.get(GoogleCalendarEventsService);
  }

  // Every test works with its own user, so the tests do not depend on each other's rows.
  async function createUser(): Promise<string> {
    const [user] = await db.insert(users).values({ googleSub: randomUUID(), email: 'person@example.com' }).returning({ id: users.id });

    return user.id;
  }

  async function createBirthday(userId: string, googleEventId: string | null = null): Promise<string> {
    const [birthday] = await db
      .insert(birthdays)
      .values({ userId, name: 'Some Person', birthDate: '1990-05-01', googleEventId })
      .returning({ id: birthdays.id });

    return birthday.id;
  }

  async function findEventId(birthdayId: string): Promise<string | null> {
    const [birthday] = await db.select({ googleEventId: birthdays.googleEventId }).from(birthdays).where(eq(birthdays.id, birthdayId));

    return birthday.googleEventId;
  }

  // A Birthdly event id of a birthday that does not exist in this database, ending with `tag`.
  function foreignEventId(tag: string): string {
    return `b${randomUUID().replaceAll('-', '')}abcdefgh${tag}`;
  }

  function requestedUrls(method: string): string[] {
    return api.request.mock.calls.filter((call) => call[1] === method).map((call) => call[2]);
  }

  function eventUrl(eventId: string): string {
    return `${BIRTHDAY_EVENTS_URL}/${eventId}`;
  }

  function createdEventIds(): string[] {
    return api.request.mock.calls.filter((call) => call[1] === 'POST').map((call) => (call[3] as { id: string }).id);
  }

  describe('with an event id tag', () => {
    let service: GoogleCalendarEventsService;

    beforeEach(async () => {
      service = await createService(DEV_TAG);
    });

    it('deletes only its own orphans on a full sync, not the events of production or another installation', async () => {
      const userId = await createUser();
      const productionOrphan = foreignEventId('');
      const otherInstallationOrphan = foreignEventId('qa');
      const ownOrphan = foreignEventId(DEV_TAG);
      googleEventIds = [productionOrphan, otherInstallationOrphan, ownOrphan];

      await service.reconcile(userId, ACCESS_TOKEN);

      expect(requestedUrls('DELETE')).toEqual([eventUrl(ownOrphan)]);
      expect(connections.markSynced).toHaveBeenCalledWith(userId);
    });

    it('creates events whose ids end with the tag and saves them', async () => {
      const userId = await createUser();
      const birthdayId = await createBirthday(userId);

      await service.reconcile(userId, ACCESS_TOKEN);

      const [createdId] = createdEventIds();
      expect(createdEventIds()).toHaveLength(1);
      expect(createdId).toMatch(new RegExp(`^b${birthdayId.replaceAll('-', '')}[0-9a-v]{8}${DEV_TAG}$`));
      expect(service.isOwnEventId(createdId)).toBe(true);
      expect(await findEventId(birthdayId)).toBe(createdId);
    });

    it('replaces an event without its tag by a new tagged one and does not delete the old event', async () => {
      const userId = await createUser();
      const untaggedEventId = foreignEventId('');
      const birthdayId = await createBirthday(userId, untaggedEventId);

      await service.syncBirthdayEvent(userId, ACCESS_TOKEN, birthdayId);

      const [createdId] = createdEventIds();
      expect(requestedUrls('PUT')).toEqual([]);
      expect(requestedUrls('DELETE')).toEqual([]);
      expect(createdId.endsWith(DEV_TAG)).toBe(true);
      expect(await findEventId(birthdayId)).toBe(createdId);
    });
  });

  describe('without an event id tag (production)', () => {
    let service: GoogleCalendarEventsService;

    beforeEach(async () => {
      service = await createService('');
    });

    it('updates an existing untagged event instead of creating a new one', async () => {
      const userId = await createUser();
      const eventId = foreignEventId('');
      const birthdayId = await createBirthday(userId, eventId);

      await service.syncBirthdayEvent(userId, ACCESS_TOKEN, birthdayId);

      expect(requestedUrls('PUT')).toEqual([eventUrl(eventId)]);
      expect(requestedUrls('POST')).toEqual([]);
      expect(await findEventId(birthdayId)).toBe(eventId);
    });

    it('deletes untagged orphans on a full sync but not the events of a tagged installation', async () => {
      const userId = await createUser();
      const ownOrphan = foreignEventId('');
      const devOrphan = foreignEventId(DEV_TAG);
      googleEventIds = [ownOrphan, devOrphan];

      await service.reconcile(userId, ACCESS_TOKEN);

      expect(requestedUrls('DELETE')).toEqual([eventUrl(ownOrphan)]);
    });
  });
});
