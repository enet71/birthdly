import type { Mock } from 'vitest';
import { Test } from '@nestjs/testing';
import { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { setTimeout as delay } from 'node:timers/promises';
import { DATABASE } from '@birthday/api-database';
import { CelebritiesImportService } from './celebrities-import.service';
import { WikimediaClient, WikimediaRateLimitError } from './wikimedia.client';

// Vitest's fake timers do not reach `node:timers/promises`, so the waits resolve at once and the spec checks their lengths.
vi.mock('node:timers/promises', () => ({ setTimeout: vi.fn(() => Promise.resolve()) }));

interface PageviewsRowStub {
  id: string;
  titles: Record<string, string>;
}

const QUEUED_AT = new Date('2026-11-20T10:00:00.000Z');
const REQUEST_PAUSE_MS = 500;

function rateLimit(retryAfterMs: number | null): WikimediaRateLimitError {
  return new WikimediaRateLimitError('429', retryAfterMs);
}

// The Drizzle queries are not unit-testable without a database, so minimal chains stand in for
// `select().from().where()` and `update().set().where()`; the spec checks which people are asked for and what is saved.
describe('CelebritiesImportService', () => {
  let service: CelebritiesImportService;
  const selectQuery: { from: Mock; where: Mock } = { from: vi.fn(), where: vi.fn() };
  const updateQuery: { set: Mock; where: Mock } = { set: vi.fn(), where: vi.fn() };
  const db: { select: Mock; update: Mock } = { select: vi.fn(), update: vi.fn() };
  const wikimedia: { getYearlyPageviews: Mock<WikimediaClient['getYearlyPageviews']> } = { getYearlyPageviews: vi.fn() };
  const delayMock: Mock = vi.mocked(delay) as unknown as Mock;

  beforeEach(async () => {
    vi.clearAllMocks();
    db.select.mockReturnValue(selectQuery);
    selectQuery.from.mockReturnValue(selectQuery);
    selectQuery.where.mockResolvedValue([]);
    db.update.mockReturnValue(updateQuery);
    updateQuery.set.mockReturnValue(updateQuery);
    updateQuery.where.mockResolvedValue(undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [CelebritiesImportService, { provide: DATABASE, useValue: db }, { provide: WikimediaClient, useValue: wikimedia }],
    }).compile();

    service = moduleRef.get(CelebritiesImportService);
  });

  function respondWith(rows: PageviewsRowStub[]): void {
    selectQuery.where.mockResolvedValue(rows);
  }

  function savedPageviews(): (number | null)[] {
    return updateQuery.set.mock.calls.map(([values]) => (values as { pageviews: number | null }).pageviews);
  }

  function rateLimitWaits(): number[] {
    return delayMock.mock.calls.map(([ms]) => ms as number).filter((ms: number) => ms !== REQUEST_PAUSE_MS);
  }

  describe('loadPageviews', () => {
    it('asks only for the given people whose page views were never loaded or were loaded before the job was queued', async () => {
      await service.loadPageviews(['Q1', 'Q2'], QUEUED_AT);

      const condition: SQL = selectQuery.where.mock.calls[0][0];
      const { sql, params } = new PgDialect().sqlToQuery(condition);

      expect(sql).toBe(
        '("celebrities"."id" in ($1, $2) and ("celebrities"."pageviews_loaded_at" is null or "celebrities"."pageviews_loaded_at" < $3))',
      );
      expect(params).toEqual(['Q1', 'Q2', QUEUED_AT.toISOString()]);
    });

    it('saves the page views of the English article of each person', async () => {
      respondWith([
        { id: 'Q1', titles: { en: 'Erica Sample', de: 'Erika Muster' } },
        { id: 'Q2', titles: { en: 'John Doe' } },
      ]);
      wikimedia.getYearlyPageviews.mockResolvedValueOnce(1200).mockResolvedValueOnce(null);

      await service.loadPageviews(['Q1', 'Q2'], QUEUED_AT);

      expect(wikimedia.getYearlyPageviews.mock.calls).toEqual([['Erica Sample'], ['John Doe']]);
      expect(savedPageviews()).toEqual([1200, null]);
    });

    it('saves null without asking Wikimedia for a person without an English article', async () => {
      respondWith([{ id: 'Q1', titles: { de: 'Erika Muster' } }]);

      await service.loadPageviews(['Q1'], QUEUED_AT);

      expect(wikimedia.getYearlyPageviews).not.toHaveBeenCalled();
      expect(savedPageviews()).toEqual([null]);
    });

    it('waits as long as the rate limit asks, retries the same person and goes on with the batch', async () => {
      respondWith([
        { id: 'Q1', titles: { en: 'A' } },
        { id: 'Q2', titles: { en: 'B' } },
      ]);
      wikimedia.getYearlyPageviews.mockRejectedValueOnce(rateLimit(5000)).mockResolvedValueOnce(100).mockResolvedValueOnce(200);

      await service.loadPageviews(['Q1', 'Q2'], QUEUED_AT);

      expect(rateLimitWaits()).toEqual([5000]);
      expect(wikimedia.getYearlyPageviews.mock.calls).toEqual([['A'], ['A'], ['B']]);
      expect(savedPageviews()).toEqual([100, 200]);
    });

    it('waits 30 seconds when the rate limit names no pause', async () => {
      respondWith([{ id: 'Q1', titles: { en: 'A' } }]);
      wikimedia.getYearlyPageviews.mockRejectedValueOnce(rateLimit(null)).mockResolvedValueOnce(100);

      await service.loadPageviews(['Q1'], QUEUED_AT);

      expect(rateLimitWaits()).toEqual([30_000]);
      expect(savedPageviews()).toEqual([100]);
    });

    it('waits a pause of exactly 60 seconds', async () => {
      respondWith([{ id: 'Q1', titles: { en: 'A' } }]);
      wikimedia.getYearlyPageviews.mockRejectedValueOnce(rateLimit(60_000)).mockResolvedValueOnce(100);

      await service.loadPageviews(['Q1'], QUEUED_AT);

      expect(rateLimitWaits()).toEqual([60_000]);
    });

    it('fails the job without waiting when the rate limit asks for more than 60 seconds', async () => {
      const error: WikimediaRateLimitError = rateLimit(60_001);

      respondWith([{ id: 'Q1', titles: { en: 'A' } }]);
      wikimedia.getYearlyPageviews.mockRejectedValueOnce(error);

      await expect(service.loadPageviews(['Q1'], QUEUED_AT)).rejects.toBe(error);
      expect(rateLimitWaits()).toEqual([]);
      expect(updateQuery.set).not.toHaveBeenCalled();
    });

    it('fails the job when a fourth wait would be needed, counting the waits across people', async () => {
      const error: WikimediaRateLimitError = rateLimit(1000);

      respondWith([
        { id: 'Q1', titles: { en: 'A' } },
        { id: 'Q2', titles: { en: 'B' } },
        { id: 'Q3', titles: { en: 'C' } },
      ]);
      wikimedia.getYearlyPageviews
        .mockRejectedValueOnce(rateLimit(1000))
        .mockRejectedValueOnce(rateLimit(1000))
        .mockResolvedValueOnce(100)
        .mockRejectedValueOnce(rateLimit(1000))
        .mockResolvedValueOnce(200)
        .mockRejectedValueOnce(error);

      await expect(service.loadPageviews(['Q1', 'Q2', 'Q3'], QUEUED_AT)).rejects.toBe(error);
      expect(rateLimitWaits()).toEqual([1000, 1000, 1000]);
      expect(savedPageviews()).toEqual([100, 200]);
    });

    it('fails the job at once on another error', async () => {
      const error = new Error('https://wikimedia.org/api failed: 500');

      respondWith([
        { id: 'Q1', titles: { en: 'A' } },
        { id: 'Q2', titles: { en: 'B' } },
      ]);
      wikimedia.getYearlyPageviews.mockRejectedValueOnce(error);

      await expect(service.loadPageviews(['Q1', 'Q2'], QUEUED_AT)).rejects.toBe(error);
      expect(wikimedia.getYearlyPageviews).toHaveBeenCalledTimes(1);
      expect(delayMock).not.toHaveBeenCalled();
      expect(updateQuery.set).not.toHaveBeenCalled();
    });
  });
});
