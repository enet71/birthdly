import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { setTimeout as delay } from 'node:timers/promises';
import { Job, JobInsert, JobWithMetadata, PgBoss } from 'pg-boss';
import { PG_BOSS } from '@birthday/api-jobs';
import {
  CELEBRITIES_DETAILS_QUEUE,
  CELEBRITIES_PAGEVIEWS_QUEUE,
  CELEBRITIES_PHOTOS_BACKFILL_QUEUE,
  CELEBRITIES_PHOTOS_QUEUE,
  CELEBRITIES_SEGMENT_QUEUE,
  CELEBRITY_SEGMENTS,
  WIKIDATA_ENTITIES_PER_REQUEST,
} from '../constants';
import { MODULE_OPTIONS_TOKEN } from '../celebrities.module-definition';
import {
  CelebritiesModuleOptions,
  CelebrityDetailsJob,
  CelebrityPageviewsJob,
  CelebrityPhotosBackfillJob,
  CelebrityPhotosJob,
  CelebritySegmentJob,
} from '../types';
import { CelebritiesImportService } from './celebrities-import.service';

// `stately` with the segment as `singletonKey`: at most one waiting and one running import per segment. Failures retry
// with growing pauses (10 min, 20 min, ...), which outlasts a QLever or Wikidata outage.
const SEGMENT_QUEUE_OPTIONS = { policy: 'stately', retryLimit: 4, retryDelay: 10 * 60, retryBackoff: true, expireInSeconds: 15 * 60 } as const;
const DETAILS_QUEUE_OPTIONS = { retryLimit: 6, retryDelay: 60, retryBackoff: true, expireInSeconds: 5 * 60 };
// Page views run into Wikimedia's rate limit on large imports: more retries, but at most 30 min apart, outlast a few hours
// of throttling.
const PAGEVIEWS_QUEUE_OPTIONS = { retryLimit: 10, retryDelay: 2 * 60, retryDelayMax: 30 * 60, retryBackoff: true, expireInSeconds: 30 * 60 };
const PHOTOS_QUEUE_OPTIONS = DETAILS_QUEUE_OPTIONS;
// `stately` with one `singletonKey`: a single chain of backfill jobs, however often the API starts.
const PHOTOS_BACKFILL_QUEUE_OPTIONS = { policy: 'stately', retryLimit: 6, retryDelay: 60, retryBackoff: true, expireInSeconds: 5 * 60 } as const;
const PHOTOS_BACKFILL_KEY = 'photos';
// One details or photos request at a time with a pause after it keeps the import gentle on Wikimedia; it has no deadline.
const DETAILS_PAUSE_MS = 1000;

// Declares the celebrity import queues and works their jobs: a segment job saves the segment's people and queues their
// details in batches of 50; each details job queues the photos and the page views of the people it kept.
@Injectable()
export class CelebritiesJobsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CelebritiesJobsService.name);

  constructor(
    @Inject(PG_BOSS) private readonly boss: PgBoss,
    @Inject(MODULE_OPTIONS_TOKEN) private readonly options: CelebritiesModuleOptions,
    private readonly importService: CelebritiesImportService,
  ) {}

  public async onApplicationBootstrap(): Promise<void> {
    // `createQueue` keeps an existing queue's settings, so changed options need `updateQueue` too.
    await this.boss.createQueue(CELEBRITIES_SEGMENT_QUEUE, SEGMENT_QUEUE_OPTIONS);
    await this.boss.updateQueue(CELEBRITIES_SEGMENT_QUEUE, {
      retryLimit: SEGMENT_QUEUE_OPTIONS.retryLimit,
      retryDelay: SEGMENT_QUEUE_OPTIONS.retryDelay,
      retryBackoff: SEGMENT_QUEUE_OPTIONS.retryBackoff,
      expireInSeconds: SEGMENT_QUEUE_OPTIONS.expireInSeconds,
    });
    await this.boss.createQueue(CELEBRITIES_DETAILS_QUEUE, DETAILS_QUEUE_OPTIONS);
    await this.boss.updateQueue(CELEBRITIES_DETAILS_QUEUE, DETAILS_QUEUE_OPTIONS);
    await this.boss.createQueue(CELEBRITIES_PAGEVIEWS_QUEUE, PAGEVIEWS_QUEUE_OPTIONS);
    await this.boss.updateQueue(CELEBRITIES_PAGEVIEWS_QUEUE, PAGEVIEWS_QUEUE_OPTIONS);
    await this.boss.createQueue(CELEBRITIES_PHOTOS_QUEUE, PHOTOS_QUEUE_OPTIONS);
    await this.boss.updateQueue(CELEBRITIES_PHOTOS_QUEUE, PHOTOS_QUEUE_OPTIONS);
    await this.boss.createQueue(CELEBRITIES_PHOTOS_BACKFILL_QUEUE, PHOTOS_BACKFILL_QUEUE_OPTIONS);

    // The queues stay, so the admin page can still read them.
    if (!this.options.importEnabled) {
      this.logger.log('The celebrity import is turned off (CELEBRITY_IMPORT_ENABLED=false)');
      return;
    }

    await this.boss.work<CelebritySegmentJob>(CELEBRITIES_SEGMENT_QUEUE, ([job]: Job<CelebritySegmentJob>[]) => this.runSegment(job.data));
    await this.boss.work<CelebrityDetailsJob>(CELEBRITIES_DETAILS_QUEUE, ([job]: Job<CelebrityDetailsJob>[]) => this.runDetails(job.data));
    await this.boss.work<CelebrityPageviewsJob, void, { includeMetadata: true }>(
      CELEBRITIES_PAGEVIEWS_QUEUE,
      { includeMetadata: true },
      ([job]: JobWithMetadata<CelebrityPageviewsJob>[]) => this.importService.loadPageviews(job.data.ids, job.createdOn),
    );
    await this.boss.work<CelebrityPhotosJob>(CELEBRITIES_PHOTOS_QUEUE, ([job]: Job<CelebrityPhotosJob>[]) => this.runPhotos(job.data));
    await this.boss.work<CelebrityPhotosBackfillJob, void, { includeMetadata: true }>(
      CELEBRITIES_PHOTOS_BACKFILL_QUEUE,
      { includeMetadata: true },
      ([job]: JobWithMetadata<CelebrityPhotosBackfillJob>[]) => this.runPhotosBackfill(job),
    );
    // People imported before photos existed get them in the background; the job reads the database only when it runs,
    // after the migrations.
    await this.sendPhotosBackfill(null);
    // A segment added since the last deployment is imported now; the job checks whether it was imported before, so this
    // does not depend on the database migrations having finished yet.
    await sendSegmentJobs(
      this.boss,
      CELEBRITY_SEGMENTS.map(({ key }) => key),
      true,
    );
  }

  private async runSegment({ segment, onlyIfNew }: CelebritySegmentJob): Promise<void> {
    if (onlyIfNew && (await this.importService.wasImported(segment))) {
      return;
    }

    const ids: string[] = await this.importService.importSegment(segment);
    const jobs: JobInsert<CelebrityDetailsJob>[] = [];

    for (let index = 0; index < ids.length; index += WIKIDATA_ENTITIES_PER_REQUEST) {
      jobs.push({ data: { ids: ids.slice(index, index + WIKIDATA_ENTITIES_PER_REQUEST) } });
    }

    if (jobs.length) {
      await this.boss.insert(CELEBRITIES_DETAILS_QUEUE, jobs);
    }

    this.logger.log({ segment, people: ids.length }, 'Imported a celebrity segment; its details load in the background');
  }

  private async runDetails({ ids }: CelebrityDetailsJob): Promise<void> {
    const kept: string[] = await this.importService.loadDetails(ids);

    if (kept.length) {
      const photosJob: CelebrityPhotosJob = { ids: kept };
      const pageviewsJob: CelebrityPageviewsJob = { ids: kept };

      await this.boss.send(CELEBRITIES_PHOTOS_QUEUE, photosJob);
      await this.boss.send(CELEBRITIES_PAGEVIEWS_QUEUE, pageviewsJob);
    }

    await delay(DETAILS_PAUSE_MS);
  }

  private async runPhotos({ ids }: CelebrityPhotosJob): Promise<void> {
    await this.importService.loadPhotos(ids);
    await delay(DETAILS_PAUSE_MS);
  }

  // One batch per job; the job queues the next one until everyone has had their photos loaded. A batch that fails its last
  // retry is skipped and stays without photos until the next start of the API.
  private async runPhotosBackfill(job: JobWithMetadata<CelebrityPhotosBackfillJob>): Promise<void> {
    const ids: string[] = await this.importService.findIdsWithoutPhotos(job.data.afterId, WIKIDATA_ENTITIES_PER_REQUEST);

    if (!ids.length) {
      return;
    }

    try {
      await this.importService.loadPhotos(ids);
    } catch (error) {
      if (job.retryCount < job.retryLimit) {
        throw error;
      }

      this.logger.warn({ err: error, ids }, 'Skipped a batch of celebrity photos after its last retry');
    }

    await delay(DETAILS_PAUSE_MS);
    await this.sendPhotosBackfill(ids[ids.length - 1]);
  }

  private async sendPhotosBackfill(afterId: string | null): Promise<void> {
    const job: CelebrityPhotosBackfillJob = { afterId };

    await this.boss.send(CELEBRITIES_PHOTOS_BACKFILL_QUEUE, job, { singletonKey: PHOTOS_BACKFILL_KEY });
  }
}

// Queues an import of each segment; also used by the `celebrities:import` command. Returns the segments that already
// had an import waiting, which pg-boss keeps instead of the new one.
export async function sendSegmentJobs(boss: PgBoss, segments: string[], onlyIfNew: boolean): Promise<string[]> {
  const waiting: string[] = [];

  for (const segment of segments) {
    const job: CelebritySegmentJob = { segment, onlyIfNew };

    if (!(await boss.send(CELEBRITIES_SEGMENT_QUEUE, job, { singletonKey: segment }))) {
      waiting.push(segment);
    }
  }

  return waiting;
}
