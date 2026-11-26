import type { Mock } from 'vitest';
import { Test } from '@nestjs/testing';
import { PG_BOSS } from '@birthday/api-jobs';
import { MODULE_OPTIONS_TOKEN } from '../celebrities.module-definition';
import {
  CELEBRITIES_DETAILS_QUEUE,
  CELEBRITIES_PAGEVIEWS_QUEUE,
  CELEBRITIES_PHOTOS_BACKFILL_QUEUE,
  CELEBRITIES_PHOTOS_QUEUE,
  CELEBRITIES_SEGMENT_QUEUE,
  CELEBRITY_SEGMENTS,
} from '../constants';
import { CelebritiesModuleOptions } from '../types';
import { CelebritiesImportService } from './celebrities-import.service';
import { CelebritiesJobsService } from './celebrities-jobs.service';

type PageviewsJobHandler = (jobs: { data: { ids: string[] }; createdOn: Date }[]) => Promise<void>;

const QUEUES: string[] = [
  CELEBRITIES_SEGMENT_QUEUE,
  CELEBRITIES_DETAILS_QUEUE,
  CELEBRITIES_PAGEVIEWS_QUEUE,
  CELEBRITIES_PHOTOS_QUEUE,
  CELEBRITIES_PHOTOS_BACKFILL_QUEUE,
];

describe('CelebritiesJobsService', () => {
  const boss: { createQueue: Mock; updateQueue: Mock; work: Mock; send: Mock; insert: Mock } = {
    createQueue: vi.fn(),
    updateQueue: vi.fn(),
    work: vi.fn(),
    send: vi.fn(),
    insert: vi.fn(),
  };
  const importService: { loadPageviews: Mock<CelebritiesImportService['loadPageviews']> } = { loadPageviews: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    boss.send.mockResolvedValue('job-id');
    importService.loadPageviews.mockResolvedValue(undefined);
  });

  async function bootstrap(importEnabled: boolean): Promise<void> {
    const options: CelebritiesModuleOptions = { importEnabled };
    const moduleRef = await Test.createTestingModule({
      providers: [
        CelebritiesJobsService,
        { provide: PG_BOSS, useValue: boss },
        { provide: MODULE_OPTIONS_TOKEN, useValue: options },
        { provide: CelebritiesImportService, useValue: importService },
      ],
    }).compile();

    await moduleRef.get(CelebritiesJobsService).onApplicationBootstrap();
  }

  // The worker pg-boss would call for the queue's jobs.
  function workerOf(queue: string): PageviewsJobHandler {
    const call = boss.work.mock.calls.find(([name]) => name === queue);

    return call?.at(-1) as PageviewsJobHandler;
  }

  describe('with the import turned off', () => {
    beforeEach(async () => {
      await bootstrap(false);
    });

    it('still declares every queue', () => {
      expect(boss.createQueue.mock.calls.map(([name]) => name)).toEqual(QUEUES);
      expect(boss.updateQueue).toHaveBeenCalled();
    });

    it('works no jobs and queues none', () => {
      expect(boss.work).not.toHaveBeenCalled();
      expect(boss.send).not.toHaveBeenCalled();
      expect(boss.insert).not.toHaveBeenCalled();
    });
  });

  describe('with the import turned on', () => {
    beforeEach(async () => {
      await bootstrap(true);
    });

    it('works the jobs of every queue', () => {
      expect(boss.work.mock.calls.map(([name]) => name)).toEqual(expect.arrayContaining(QUEUES));
    });

    it('queues the photos backfill and an import of each segment that was not imported yet', () => {
      expect(boss.send).toHaveBeenCalledWith(CELEBRITIES_PHOTOS_BACKFILL_QUEUE, { afterId: null }, { singletonKey: 'photos' });

      for (const { key } of CELEBRITY_SEGMENTS) {
        expect(boss.send).toHaveBeenCalledWith(CELEBRITIES_SEGMENT_QUEUE, { segment: key, onlyIfNew: true }, { singletonKey: key });
      }
    });

    it('loads the page views of a job with its creation time', async () => {
      const createdOn = new Date('2026-11-20T10:00:00.000Z');

      await workerOf(CELEBRITIES_PAGEVIEWS_QUEUE)([{ data: { ids: ['Q1', 'Q2'] }, createdOn }]);

      expect(importService.loadPageviews).toHaveBeenCalledWith(['Q1', 'Q2'], createdOn);
    });
  });
});
