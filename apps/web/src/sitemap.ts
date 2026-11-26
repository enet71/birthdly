import { APP_DEFAULT_LOCALE, APP_LOCALES, AppLocale, isLocalizedPath, localizePath } from '@birthday/web-shared-i18n';
import { APP_SITE_URL } from './app/app.constants';
import { APP_LOCALIZED_PATHS } from './app/app.routes';
import { GUIDES } from './app/pages/guides/guides.constants';
import { getGuidePath } from './app/pages/guides/guides.helpers';

interface SitemapPage {
  path: string;
  // ISO date of the last content change.
  lastmod?: string;
}

// Update `lastmod` when a page's content changes; a guide takes it from its `updatedAt`.
const MAIN_PAGES: SitemapPage[] = [
  { path: '/', lastmod: '2026-11-06' },
  { path: '/about', lastmod: '2026-11-10' },
  { path: '/privacy', lastmod: '2026-11-24' },
  { path: '/terms', lastmod: '2026-11-10' },
  { path: '/feedback', lastmod: '2026-11-23' },
  { path: '/roadmap', lastmod: '2026-11-25' },
  { path: '/guides', lastmod: '2026-11-10' },
  ...GUIDES.map((guide) => ({ path: getGuidePath(guide), lastmod: guide.updatedAt })),
];

const LOCALIZED_PATHS: ReadonlySet<string> = new Set(APP_LOCALIZED_PATHS);

// A public page is listed once per language, and each entry links all of them, as the `hreflang` tags on the page do.
function buildSitemap(pages: SitemapPage[]): string {
  const urls: string[] = pages.flatMap((page: SitemapPage) =>
    isLocalizedPath(page.path, LOCALIZED_PATHS)
      ? APP_LOCALES.map((locale: AppLocale) => buildUrl(page, localizePath(page.path, locale), buildAlternateLinks(page.path)))
      : [buildUrl(page, page.path, '')],
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

function buildUrl(page: SitemapPage, path: string, alternateLinks: string): string {
  const lastmod: string = page.lastmod ? `\n    <lastmod>${page.lastmod}</lastmod>` : '';

  return `  <url>\n    <loc>${APP_SITE_URL}${path}</loc>${lastmod}${alternateLinks}\n  </url>`;
}

function buildAlternateLinks(path: string): string {
  const links: string[] = [
    ...APP_LOCALES.map((locale: AppLocale) => buildAlternateLink(locale, localizePath(path, locale))),
    buildAlternateLink('x-default', localizePath(path, APP_DEFAULT_LOCALE)),
  ];

  return links.map((link: string) => `\n    ${link}`).join('');
}

function buildAlternateLink(hreflang: string, path: string): string {
  return `<xhtml:link rel="alternate" hreflang="${hreflang}" href="${APP_SITE_URL}${path}"/>`;
}

// Every date of a leap year, so February 29 is listed too. The section is a lazy library, so it loads on the first request.
async function buildBornPages(): Promise<SitemapPage[]> {
  const { BORN_MONTH_SLUGS, getBornDayPath } = await import('@birthday/web-celebrities-feature-born');

  return BORN_MONTH_SLUGS.flatMap((_, monthIndex: number) =>
    Array.from({ length: new Date(Date.UTC(2024, monthIndex + 1, 0)).getUTCDate() }, (__, dayIndex: number) => ({
      path: getBornDayPath({ month: monthIndex + 1, day: dayIndex + 1 }),
    })),
  );
}

// Served by `server.ts` at these paths; `robots.txt` lists both. Each one is built once, on its first request.
const SITEMAP_BUILDERS: Record<string, () => Promise<string>> = {
  '/sitemap.xml': async () => buildSitemap(MAIN_PAGES),
  '/sitemap-born.xml': async () => buildSitemap(await buildBornPages()),
};

const sitemaps: Map<string, Promise<string>> = new Map();

export const SITEMAP_PATHS: string[] = Object.keys(SITEMAP_BUILDERS);

export function getSitemap(path: string): Promise<string> {
  let sitemap: Promise<string> | undefined = sitemaps.get(path);

  if (!sitemap) {
    // A failed build is not kept, so the next request tries again.
    sitemap = SITEMAP_BUILDERS[path]().catch((error: unknown) => {
      sitemaps.delete(path);
      throw error;
    });
    sitemaps.set(path, sitemap);
  }

  return sitemap;
}
