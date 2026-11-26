import { ActivatedRouteSnapshot, Data } from '@angular/router';
import { APP_ROUTE_LOCALE_DATA_KEY } from '../constants';
import { getRouteLocale, isLocalizedPath, localizePath, parseLocalePath } from './locale-path.helpers';

describe('localizePath', () => {
  it('prefixes the home page with the language', () => {
    expect(localizePath('/', 'de')).toBe('/de');
  });

  it('prefixes a page path with the language', () => {
    expect(localizePath('/about', 'de')).toBe('/de/about');
  });

  it('keeps the query of the home page without a slash before it', () => {
    expect(localizePath('/?year=1', 'de')).toBe('/de?year=1');
  });

  it('keeps the hash of the home page without a slash before it', () => {
    expect(localizePath('/#top', 'fr')).toBe('/fr#top');
  });

  it('keeps the query and hash of a page', () => {
    expect(localizePath('/born/february/29?year=2000#list', 'uk')).toBe('/uk/born/february/29?year=2000#list');
  });

  it.each(['/', '/about', '/?year=1'])('leaves the English path %s unchanged', (path: string) => {
    expect(localizePath(path, 'en')).toBe(path);
  });
});

describe('parseLocalePath', () => {
  it('reads the language of the home page', () => {
    expect(parseLocalePath('/de')).toEqual({ locale: 'de', path: '/' });
  });

  it('reads the language and keeps the query and hash of the path', () => {
    expect(parseLocalePath('/de/about?x=1#y')).toEqual({ locale: 'de', path: '/about?x=1#y' });
  });

  it('keeps the query of the home page', () => {
    expect(parseLocalePath('/es?year=1')).toEqual({ locale: 'es', path: '/?year=1' });
  });

  it('does not treat /en as a prefix, since English URLs have none', () => {
    expect(parseLocalePath('/en/about')).toEqual({ locale: null, path: '/en/about' });
  });

  it('does not treat a longer first segment that starts with a language as a prefix', () => {
    expect(parseLocalePath('/deutsch')).toEqual({ locale: null, path: '/deutsch' });
  });

  it('does not treat an unsupported two-letter segment as a prefix', () => {
    expect(parseLocalePath('/xx/about')).toEqual({ locale: null, path: '/xx/about' });
  });

  it('returns an unprefixed path as is', () => {
    expect(parseLocalePath('/about')).toEqual({ locale: null, path: '/about' });
  });
});

describe('isLocalizedPath', () => {
  const localizedPaths: ReadonlySet<string> = new Set(['', 'about', 'born']);

  it('accepts the home page', () => {
    expect(isLocalizedPath('/', localizedPaths)).toBe(true);
  });

  it('accepts a public page', () => {
    expect(isLocalizedPath('/born/march/3', localizedPaths)).toBe(true);
  });

  it.each(['/about?x=1', '/about#y', '/?year=1', '/#top'])('accepts the public path %s with a query or hash', (path: string) => {
    expect(isLocalizedPath(path, localizedPaths)).toBe(true);
  });

  it('rejects a private page', () => {
    expect(isLocalizedPath('/people', localizedPaths)).toBe(false);
  });

  it('rejects a page whose name only starts with a public one', () => {
    expect(isLocalizedPath('/aboutus', localizedPaths)).toBe(false);
  });

  it.each(['about', 'march/3', '../about'])('rejects the relative path %s', (path: string) => {
    expect(isLocalizedPath(path, localizedPaths)).toBe(false);
  });

  it('rejects the home page when it is not listed', () => {
    expect(isLocalizedPath('/', new Set(['about']))).toBe(false);
  });
});

describe('getRouteLocale', () => {
  function createRoute(pathData: Data[]): ActivatedRouteSnapshot {
    const pathFromRoot: ActivatedRouteSnapshot[] = pathData.map((data: Data) => ({ data }) as ActivatedRouteSnapshot);

    return { ...pathFromRoot[pathFromRoot.length - 1], pathFromRoot } as ActivatedRouteSnapshot;
  }

  it('reads the language from an ancestor route', () => {
    expect(getRouteLocale(createRoute([{}, { [APP_ROUTE_LOCALE_DATA_KEY]: 'de' }, {}]))).toBe('de');
  });

  it('reads English from the unprefixed public routes', () => {
    expect(getRouteLocale(createRoute([{ [APP_ROUTE_LOCALE_DATA_KEY]: 'en' }, {}]))).toBe('en');
  });

  it('returns null for a route without a language', () => {
    expect(getRouteLocale(createRoute([{}, {}]))).toBeNull();
  });

  it('ignores an unsupported language value', () => {
    expect(getRouteLocale(createRoute([{ [APP_ROUTE_LOCALE_DATA_KEY]: 'xx' }, {}]))).toBeNull();
  });
});
