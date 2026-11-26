import { CelebrityOccupation } from '@birthday/shared-models';

// People of one country and field, imported together.
export interface CelebritySegment {
  // For example `US-film`; also the key of the segment's row in `celebrity_imports`.
  key: string;
  // The Wikidata item of the country, for example `Q30`.
  countryItem: string;
  // Its ISO 3166-1 alpha-2 code.
  country: string;
  occupation: CelebrityOccupation;
}

export interface CelebritySegmentJob {
  segment: string;
  // Set by the API on start: the job then skips a segment that was imported before.
  onlyIfNew: boolean;
}

export interface CelebrityDetailsJob {
  ids: string[];
}

export interface CelebrityPageviewsJob {
  ids: string[];
}

export interface CelebrityPhotosJob {
  ids: string[];
}

export interface CelebrityPhotosBackfillJob {
  // The batch starts after this id, so a batch that keeps failing does not stop the ones after it.
  afterId: string | null;
}

// A Commons photo the cards may show.
export interface CelebrityPhoto {
  // A thumbnail `CELEBRITY_PHOTO_WIDTH` pixels wide.
  url: string;
  // Plain text; `null` when the license does not require attribution and Commons names nobody.
  author: string | null;
  // For example `CC BY-SA 4.0`.
  license: string;
  licenseUrl: string | null;
}

// A person found by the segment query.
export interface CelebrityCandidate {
  id: string;
  // `yyyy-MM-dd`.
  birthDate: string;
  sitelinks: number;
  // ISO 3166-1 alpha-2 codes.
  countries: string[];
}

// What the import keeps from a person's Wikidata item.
export interface CelebrityDetails {
  // Labels per language code, including `mul`.
  names: Record<string, string>;
  // Wikipedia article titles per language code.
  wikipediaTitles: Record<string, string>;
  // `yyyy-MM-dd`; January 1 when only the year is known.
  deathDate: string | null;
  // Occupations (P106) in Wikidata's order.
  occupationItems: string[];
}

export interface CelebritiesModuleOptions {
  // `false` keeps this API from working and queueing import jobs, so it never calls Wikimedia.
  importEnabled: boolean;
}
