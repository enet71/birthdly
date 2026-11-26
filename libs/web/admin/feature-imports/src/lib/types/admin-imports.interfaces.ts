import { CelebrityImportStatus, CelebritySegmentImportDto } from '@birthday/shared-models';

// A background step of the import, counted over all imported people.
export interface AdminImportStage {
  label: string;
  done: number;
  total: number;
  // 0–100.
  percent: number;
}

// The import segments of one country, summed up for its collapsible row.
export interface AdminSegmentGroup {
  // ISO 3166-1 alpha-2 code, the prefix of the segment keys.
  country: string;
  countryName: string;
  // The most urgent status of its segments.
  status: CelebrityImportStatus;
  finished: number;
  // ISO timestamps: the earliest start and the latest finish of its segments.
  startedAt: string | null;
  finishedAt: string | null;
  // `null` while none of its segments has been imported.
  people: number | null;
  segments: CelebritySegmentImportDto[];
}
