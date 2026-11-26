import { Translation } from '@jsverse/transloco';
import type { AppLocale } from '@birthday/shared-models';

// Shared with the API, which validates the language of notifications.
export type { AppLocale };

export type DateInput = Date | string | number;

// Loads the app's translation file for a language, usually as a lazy `import()` chunk.
export type TranslationFileLoader = (locale: AppLocale) => Promise<Translation>;

export interface I18nOptions {
  loadTranslation: TranslationFileLoader;
  // The first path segments of the public pages, which have a URL per language; `''` is the home page.
  localizedPaths: readonly string[];
}

// A URL split into its language prefix and the path that is the same in every language.
export interface LocalePath {
  // `null` when the URL has no language prefix, as English URLs do.
  locale: AppLocale | null;
  path: string;
}
