import { AppLocale } from '../i18n';
import { CelebrityOccupation } from './celebrity.dto';

export const CELEBRITY_STATUSES = ['all', 'living', 'deceased'] as const;

export type CelebrityStatus = (typeof CELEBRITY_STATUSES)[number];

// `popularity`: views of the English Wikipedia article in the last year.
export const CELEBRITY_SORTS = ['popularity', 'youngest', 'oldest'] as const;

export type CelebritySort = (typeof CELEBRITY_SORTS)[number];

// People per page of `GET /api/celebrities`. Divisible by 4, 3 and 2, so every page fills the last row of the card
// grid on the born page at any column count.
export const CELEBRITIES_PAGE_SIZE = 48;

// `GET /api/celebrities`. Build its query with `toCelebritiesQueryParams`: the lists travel comma-separated
// (`countries=US,UA`). Every field except `month` and `day` is optional in the URL; empty lists and a `null` year do
// not filter.
export interface CelebritiesRequest {
  // 1–12.
  month: number;
  day: number;
  // The language of the names and the Wikipedia links.
  locale: AppLocale;
  // ISO 3166-1 alpha-2 codes; a person with any of these citizenships matches.
  countries: string[];
  occupations: CelebrityOccupation[];
  // The year of birth, 1 to the current year; the date must exist in it.
  year: number | null;
  status: CelebrityStatus;
  sort: CelebritySort;
  offset: number;
}

// The years the `year` filter accepts: from year 1 to the current one. The year is taken in UTC, so the browser and the
// API agree on it around New Year.
export function isCelebrityYear(year: number): boolean {
  return Number.isInteger(year) && year >= 1 && year <= new Date().getUTCFullYear();
}

// Whether the date exists in the year: February 29 only in a leap year. The month and day must already form a date of a
// leap year.
export function isCelebrityBirthYear(year: number, month: number, day: number): boolean {
  const isLeapYear: boolean = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

  return isCelebrityYear(year) && (month !== 2 || day !== 29 || isLeapYear);
}

// The query parameters of `GET /api/celebrities`; lists are comma-separated, empty ones and default values are left out.
export function toCelebritiesQueryParams(request: CelebritiesRequest): Record<string, string> {
  const params: Record<string, string> = { month: String(request.month), day: String(request.day), locale: request.locale };
  const lists: Record<string, string[]> = { countries: request.countries, occupations: request.occupations };

  for (const [key, values] of Object.entries(lists)) {
    if (values.length) {
      params[key] = values.join(',');
    }
  }

  if (request.year !== null) {
    params['year'] = String(request.year);
  }

  if (request.status !== 'all') {
    params['status'] = request.status;
  }

  if (request.sort !== 'popularity') {
    params['sort'] = request.sort;
  }

  if (request.offset) {
    params['offset'] = String(request.offset);
  }

  return params;
}
