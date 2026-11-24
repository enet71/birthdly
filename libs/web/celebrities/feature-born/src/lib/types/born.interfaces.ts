import { CelebrityDecade, CelebrityOccupation, CelebritySort, CelebrityStatus } from '@birthday/shared-models';

// A birthday without a year; `month` is 1–12.
export interface BornDate {
  month: number;
  day: number;
}

// The filters of the date page; empty lists do not filter.
export interface BornFilters {
  // ISO 3166-1 alpha-2 codes.
  countries: string[];
  occupations: CelebrityOccupation[];
  decades: CelebrityDecade[];
  status: CelebrityStatus;
  sort: CelebritySort;
}

// A piece of the formatted date in the page title; the day number gets its own style.
export interface BornTitlePart {
  text: string;
  isDay: boolean;
}

export interface BornCountryOption {
  code: string;
  // In the current language.
  name: string;
}

export interface CelebrityCountry {
  code: string;
  // In the current language; `null` for historical countries, whose names come from translations.
  name: string | null;
  // `null` when there is no flag image; the card shows the code instead.
  flagUrl: string | null;
}

export interface CelebrityCard {
  id: string;
  name: string;
  occupation: CelebrityOccupation | null;
  // Every citizenship, with names in the current language; empty when unknown.
  countries: CelebrityCountry[];
  birthYear: number;
  // `null` while the person is alive.
  deathYear: number | null;
  // The age the person turns this year; `null` for deceased people.
  age: number | null;
  wikipediaUrl: string | null;
}
