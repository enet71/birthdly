import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { provideRouter, Route, Router, TitleStrategy } from '@angular/router';
import { APP_ROUTE_LOCALE_DATA_KEY, AppTranslateService, LocaleState } from '@birthday/web-shared-i18n';
import { APP_NOINDEX_DATA_KEY } from '@birthday/web-shared-util';
import { AppPageMetaStrategy } from './app-page-meta.strategy';

interface AlternateLink {
  hreflang: string;
  href: string;
}

// The public pages exist per language, as in `app.routes.ts`; `/people` has one URL for every language.
function buildPublicRoutes(): Route[] {
  return [
    { path: '', pathMatch: 'full', children: [] },
    { path: 'about', children: [] },
    { path: 'hidden', data: { [APP_NOINDEX_DATA_KEY]: true }, children: [] },
  ];
}

const ROUTES: Route[] = [
  { path: 'people', children: [] },
  { path: 'de', data: { [APP_ROUTE_LOCALE_DATA_KEY]: 'de' }, children: buildPublicRoutes() },
  { path: '', data: { [APP_ROUTE_LOCALE_DATA_KEY]: 'en' }, children: buildPublicRoutes() },
];

describe('AppPageMetaStrategy', () => {
  let router: Router;
  let document: Document;
  let meta: Meta;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(ROUTES),
        { provide: TitleStrategy, useClass: AppPageMetaStrategy },
        { provide: AppTranslateService, useValue: { translate: (key: string) => key } },
      ],
    });

    router = TestBed.inject(Router);
    document = TestBed.inject(DOCUMENT);
    meta = TestBed.inject(Meta);
    document.head.replaceChildren();
  });

  // The strategy writes the language versions into `<head>`, where search engines read them.
  function getAlternateLinks(): AlternateLink[] {
    return Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')).map((link: HTMLLinkElement) => ({
      hreflang: link.hreflang,
      href: link.href,
    }));
  }

  function getCanonicalUrl(): string | undefined {
    return document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;
  }

  function getOpenGraphAlternates(): string[] {
    return meta.getTags('property="og:locale:alternate"').map((tag: HTMLMetaElement) => tag.content);
  }

  it('links the language versions of a prefixed public page', async () => {
    // `localeRouteGuard` shows a prefixed page in its language before the tags are written.
    TestBed.inject(LocaleState).locale.set('de');
    await router.navigateByUrl('/de/about?x=1');

    expect(getCanonicalUrl()).toBe('https://birthdly.com/de/about');
    expect(getAlternateLinks()).toEqual([
      { hreflang: 'en', href: 'https://birthdly.com/about' },
      { hreflang: 'es', href: 'https://birthdly.com/es/about' },
      { hreflang: 'de', href: 'https://birthdly.com/de/about' },
      { hreflang: 'fr', href: 'https://birthdly.com/fr/about' },
      { hreflang: 'ru', href: 'https://birthdly.com/ru/about' },
      { hreflang: 'uk', href: 'https://birthdly.com/uk/about' },
      { hreflang: 'x-default', href: 'https://birthdly.com/about' },
    ]);
    expect(getOpenGraphAlternates()).toEqual(['en_US', 'es_ES', 'fr_FR', 'ru_RU', 'uk_UA']);
  });

  it('links the language versions of the English home page', async () => {
    await router.navigateByUrl('/');

    expect(getCanonicalUrl()).toBe('https://birthdly.com/');
    expect(getAlternateLinks()).toContainEqual({ hreflang: 'de', href: 'https://birthdly.com/de' });
    expect(getAlternateLinks()).toContainEqual({ hreflang: 'x-default', href: 'https://birthdly.com/' });
    expect(getOpenGraphAlternates()).toEqual(['es_ES', 'de_DE', 'fr_FR', 'ru_RU', 'uk_UA']);
  });

  it('keeps one set of language links after several navigations', async () => {
    await router.navigateByUrl('/about');
    await router.navigateByUrl('/de/about');

    expect(getAlternateLinks()).toHaveLength(7);
    expect(getOpenGraphAlternates()).toHaveLength(5);
  });

  it('removes the language links on a noindex page', async () => {
    await router.navigateByUrl('/de/about');
    await router.navigateByUrl('/de/hidden');

    expect(getCanonicalUrl()).toBe('https://birthdly.com/de/hidden');
    expect(getAlternateLinks()).toEqual([]);
    expect(getOpenGraphAlternates()).toEqual([]);
  });

  it('removes the language links on a page without a language', async () => {
    await router.navigateByUrl('/about');
    await router.navigateByUrl('/people');

    expect(getCanonicalUrl()).toBe('https://birthdly.com/people');
    expect(getAlternateLinks()).toEqual([]);
    expect(getOpenGraphAlternates()).toEqual([]);
  });
});
