import { ActivatedRouteSnapshot } from '@angular/router';
import { APP_DEFAULT_LOCALE, APP_ROUTE_LOCALE_DATA_KEY } from '../constants';
import { AppLocale, LocalePath } from '../types';
import { isAppLocale } from './locale.helpers';

const LOCALE_PREFIX_PATTERN = /^\/([a-z]{2})(?=[/?#]|$)(.*)$/;

// `/about` → `/de/about`, `/` → `/de`, `/?year=1990` → `/de?year=1990`; English URLs have no prefix.
export function localizePath(path: string, locale: AppLocale): string {
  if (locale === APP_DEFAULT_LOCALE) {
    return path;
  }

  return `/${locale}${path.replace(/^\/(?=[?#]|$)/, '')}`;
}

// Whether an absolute path leads to a public page, which has a URL per language; `localizedPaths` holds their first segments
// (`''` is the home page). A relative path already keeps the prefix of the current URL.
export function isLocalizedPath(path: string, localizedPaths: ReadonlySet<string>): boolean {
  return path.startsWith('/') && localizedPaths.has(path.split(/[/?#]/)[1]);
}

// `/de/about?x=1` → `{ locale: 'de', path: '/about?x=1' }`, `/de` → `{ locale: 'de', path: '/' }`.
export function parseLocalePath(url: string): LocalePath {
  const match: RegExpExecArray | null = LOCALE_PREFIX_PATTERN.exec(url);
  const locale: string | undefined = match?.[1];

  if (!match || locale === APP_DEFAULT_LOCALE || !isAppLocale(locale)) {
    return { locale: null, path: url };
  }

  return { locale, path: match[2].startsWith('/') ? match[2] : `/${match[2]}` };
}

// The language of a public page, or `null` for a page whose URL does not depend on the language.
export function getRouteLocale(route: ActivatedRouteSnapshot): AppLocale | null {
  return (
    route.pathFromRoot.find((item: ActivatedRouteSnapshot) => isAppLocale(item.data[APP_ROUTE_LOCALE_DATA_KEY]))?.data[APP_ROUTE_LOCALE_DATA_KEY] ??
    null
  );
}
