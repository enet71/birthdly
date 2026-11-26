import { getSitemap, SITEMAP_PATHS } from './sitemap';

interface SitemapUrl {
  loc: string;
  alternates: Record<string, string>;
}

// Reads the `<url>` entries with their `xhtml:link` alternates from the generated XML.
function parseUrls(xml: string): SitemapUrl[] {
  return Array.from(xml.matchAll(/<url>([\s\S]*?)<\/url>/g), ([, body]: RegExpExecArray) => ({
    loc: /<loc>(.*?)<\/loc>/.exec(body)?.[1] ?? '',
    alternates: Object.fromEntries(
      Array.from(body.matchAll(/<xhtml:link rel="alternate" hreflang="([^"]+)" href="([^"]+)"\/>/g), ([, hreflang, href]: RegExpExecArray) => [
        hreflang,
        href,
      ]),
    ),
  }));
}

function findUrl(urls: SitemapUrl[], loc: string): SitemapUrl | undefined {
  return urls.find((url: SitemapUrl) => url.loc === loc);
}

describe('getSitemap', () => {
  it('serves the main and the born sitemaps', () => {
    expect(SITEMAP_PATHS).toEqual(['/sitemap.xml', '/sitemap-born.xml']);
  });

  describe('/sitemap.xml', () => {
    let urls: SitemapUrl[];

    beforeAll(async () => {
      urls = parseUrls(await getSitemap('/sitemap.xml'));
    });

    it('lists every public page in each language and the legal pages once', () => {
      expect(urls).toHaveLength(50);
    });

    it('lists the home page without and with a language prefix', () => {
      expect(findUrl(urls, 'https://birthdly.com/')).toBeDefined();
      expect(findUrl(urls, 'https://birthdly.com/de')).toBeDefined();
    });

    it('links all languages and x-default from a localized page', () => {
      expect(findUrl(urls, 'https://birthdly.com/fr/about')?.alternates).toEqual({
        en: 'https://birthdly.com/about',
        es: 'https://birthdly.com/es/about',
        de: 'https://birthdly.com/de/about',
        fr: 'https://birthdly.com/fr/about',
        ru: 'https://birthdly.com/ru/about',
        uk: 'https://birthdly.com/uk/about',
        'x-default': 'https://birthdly.com/about',
      });
    });

    it('links the home pages without a slash after the prefix', () => {
      expect(findUrl(urls, 'https://birthdly.com/')?.alternates).toMatchObject({
        de: 'https://birthdly.com/de',
        'x-default': 'https://birthdly.com/',
      });
    });

    it('gives every localized page all six languages and x-default', () => {
      const localized: SitemapUrl[] = urls.filter((url: SitemapUrl) => Object.keys(url.alternates).length);

      expect(localized).toHaveLength(48);
      localized.forEach((url: SitemapUrl) => expect(Object.keys(url.alternates)).toEqual(['en', 'es', 'de', 'fr', 'ru', 'uk', 'x-default']));
    });

    it.each(['/privacy', '/terms'])('lists the legal page %s once without alternates', (path: string) => {
      expect(findUrl(urls, `https://birthdly.com${path}`)?.alternates).toEqual({});
      expect(findUrl(urls, `https://birthdly.com/de${path}`)).toBeUndefined();
    });

    it('declares the xhtml namespace for the alternates', async () => {
      expect(await getSitemap('/sitemap.xml')).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    });
  });

  describe('/sitemap-born.xml', () => {
    let urls: SitemapUrl[];

    beforeAll(async () => {
      urls = parseUrls(await getSitemap('/sitemap-born.xml'));
    });

    it('lists every date of a leap year in each language', () => {
      expect(urls).toHaveLength(366 * 6);
    });

    it('lists February 29 with a language prefix and its alternates', () => {
      expect(findUrl(urls, 'https://birthdly.com/de/born/february/29')?.alternates).toMatchObject({
        en: 'https://birthdly.com/born/february/29',
        uk: 'https://birthdly.com/uk/born/february/29',
        'x-default': 'https://birthdly.com/born/february/29',
      });
    });
  });

  it('returns the cached sitemap on a repeated call', () => {
    expect(getSitemap('/sitemap.xml')).toBe(getSitemap('/sitemap.xml'));
  });
});
