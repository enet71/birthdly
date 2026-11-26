import type { Mock } from 'vitest';
import { WikimediaClient, WikimediaRateLimitError } from './wikimedia.client';

const NOW = new Date('2026-11-20T10:00:00.000Z');
const PAGEVIEWS_URL = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/A/monthly/x/y';

// A `Response` built in a test has an empty `url`, which the client reads for its error messages.
function response(body: string, init: ResponseInit): Response {
  const result = new Response(body, init);

  Object.defineProperty(result, 'url', { value: PAGEVIEWS_URL });

  return result;
}

describe('WikimediaClient', () => {
  let client: WikimediaClient;
  const fetchMock: Mock<typeof fetch> = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.stubGlobal('fetch', fetchMock);
    client = new WikimediaClient();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  async function rateLimitOf(headers: Record<string, string>): Promise<WikimediaRateLimitError> {
    fetchMock.mockResolvedValue(response('Too many requests', { status: 429, headers }));

    const error: unknown = await client.getYearlyPageviews('A', NOW).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(WikimediaRateLimitError);

    return error as WikimediaRateLimitError;
  }

  describe('getYearlyPageviews', () => {
    it('sums the monthly views', async () => {
      fetchMock.mockResolvedValue(response(JSON.stringify({ items: [{ views: 10 }, { views: 5 }] }), { status: 200 }));

      await expect(client.getYearlyPageviews('A', NOW)).resolves.toBe(15);
    });

    it('returns null when the API knows no views of the article', async () => {
      fetchMock.mockResolvedValue(response('Not found', { status: 404 }));

      await expect(client.getYearlyPageviews('A', NOW)).resolves.toBeNull();
    });

    it('reads the pause of a 429 from Retry-After seconds', async () => {
      const error: WikimediaRateLimitError = await rateLimitOf({ 'Retry-After': '120' });

      expect(error.retryAfterMs).toBe(120_000);
    });

    it('reads the pause of a 429 from a Retry-After date', async () => {
      const error: WikimediaRateLimitError = await rateLimitOf({ 'Retry-After': new Date(NOW.getTime() + 90_000).toUTCString() });

      expect(error.retryAfterMs).toBe(90_000);
    });

    it('reads a Retry-After date in the past as no pause', async () => {
      const error: WikimediaRateLimitError = await rateLimitOf({ 'Retry-After': new Date(NOW.getTime() - 90_000).toUTCString() });

      expect(error.retryAfterMs).toBe(0);
    });

    it.each<[string, Record<string, string>]>([
      ['without Retry-After', {}],
      ['with an unreadable Retry-After', { 'Retry-After': 'soon' }],
    ])('names no pause for a 429 %s', async (_case: string, headers: Record<string, string>) => {
      const error: WikimediaRateLimitError = await rateLimitOf(headers);

      expect(error.retryAfterMs).toBeNull();
    });

    it('throws a plain error for other failures', async () => {
      fetchMock.mockResolvedValue(response('Server error', { status: 500 }));

      const error: unknown = await client.getYearlyPageviews('A', NOW).catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(Error);
      expect(error).not.toBeInstanceOf(WikimediaRateLimitError);
    });
  });
});
