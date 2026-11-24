export const BORN_BASE_PATH = '/born';

// English month names in URLs, the same for every language.
export const BORN_MONTH_SLUGS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const;

export const BORN_MONTH_PARAM = 'month';
export const BORN_DAY_PARAM = 'day';

// Filter query parameters; list filters keep their values comma-separated, for example `?country=us,ua`.
export const BORN_COUNTRY_QUERY_PARAM = 'country';
export const BORN_OCCUPATION_QUERY_PARAM = 'occupation';
export const BORN_DECADE_QUERY_PARAM = 'decade';
export const BORN_STATUS_QUERY_PARAM = 'status';
export const BORN_SORT_QUERY_PARAM = 'sort';

// Route `data` key with the first page of people the resolver loaded and their total; the page's SEO tags read them.
export const BORN_CELEBRITIES_DATA_KEY = 'celebrities';

// How many names the meta description lists.
export const BORN_DESCRIPTION_NAME_COUNT = 3;

// Withdrawn ISO 3166-1 codes that Wikidata gives for historical citizenships. `Intl.DisplayNames` names them after a
// successor state (SU as Russia, DD as Germany), so their names come from the `born.historicalCountries` translations.
export const BORN_HISTORICAL_COUNTRY_CODES: ReadonlySet<string> = new Set(['CS', 'DD', 'SU', 'YU']);

// Historical flags kept in `libs/web/assets/images/flags`. CS has none: Wikidata gives it to both Czechoslovakia and
// Serbia and Montenegro.
export const BORN_HISTORICAL_FLAG_CODES: ReadonlySet<string> = new Set(['DD', 'SU', 'YU']);

// Other withdrawn codes; `flag-icons` has no flags for them, so the card shows the code instead of a missing image.
export const BORN_CODES_WITHOUT_FLAG: ReadonlySet<string> = new Set(['AN', 'BU', 'DY', 'HV', 'NH', 'NT', 'RH', 'TP', 'VD', 'YD', 'ZR']);
