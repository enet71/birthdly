import { CelebrityPhoto } from '../types';

// The parts of the Commons `imageinfo` answer the import reads.
export interface CommonsImagesResponse {
  query?: {
    normalized?: { from: string; to: string }[];
    redirects?: { from: string; to: string }[];
    pages?: CommonsPage[];
  };
}

interface CommonsPage {
  title: string;
  missing?: boolean;
  imageinfo?: { thumburl?: string; extmetadata?: Record<string, { value?: unknown } | undefined> }[];
}

const FILE_PREFIX = 'File:';
const HTML_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const MAX_AUTHOR_LENGTH = 200;
// What Commons' `{{Unknown|author}}` and `{{Anonymous}}` templates and common hand-written placeholders turn into; such an
// author is no author.
const UNKNOWN_AUTHORS: ReadonlySet<string> = new Set([
  'anonymous',
  'author unknown',
  'unknown',
  'unknown artist',
  'unknown author',
  'unknown photographer',
]);

export function toCommonsTitle(file: string): string {
  return `${FILE_PREFIX}${file}`;
}

// The photo of each asked file; `null` for a missing file, one without a license, or one that requires attribution but
// names no author. Commons normalizes and follows redirects of the asked titles, so the answer is matched back through them.
export function parseCommonsImages(files: string[], response: CommonsImagesResponse): Map<string, CelebrityPhoto | null> {
  const renamed: Map<string, string> = new Map(
    [...(response.query?.normalized ?? []), ...(response.query?.redirects ?? [])].map(({ from, to }) => [from, to]),
  );
  const pages: Map<string, CommonsPage> = new Map((response.query?.pages ?? []).map((page: CommonsPage) => [page.title, page]));

  return new Map(
    files.map((file: string) => {
      let title: string = toCommonsTitle(file);

      // A title is at most normalized and then redirected once.
      for (let step = 0; step < 2 && renamed.has(title); step++) {
        title = renamed.get(title) as string;
      }

      const page: CommonsPage | undefined = pages.get(title);

      return [file, page && !page.missing ? toPhoto(page) : null];
    }),
  );
}

function toPhoto(page: CommonsPage): CelebrityPhoto | null {
  const info = page.imageinfo?.[0];
  const metadata = info?.extmetadata ?? {};
  const license: string | null = toPlainText(metadata['LicenseShortName']?.value);
  const author: string | null = toAuthor(metadata['Artist']?.value);
  const requiresAttribution: boolean = metadata['AttributionRequired']?.value !== 'false';

  if (!info?.thumburl || !license || (requiresAttribution && !author)) {
    return null;
  }

  return { url: withoutQuery(info.thumburl), author, license, licenseUrl: toPlainText(metadata['LicenseUrl']?.value) };
}

// Commons adds `utm_*` tracking parameters to thumbnail URLs; the image loads the same without them.
function withoutQuery(value: string): string {
  const url = new URL(value);

  url.search = '';

  return url.toString();
}

function toAuthor(value: unknown): string | null {
  const author: string | null = toPlainText(value);

  return author && !UNKNOWN_AUTHORS.has(author.toLowerCase().replace(/[.:]+$/, '')) ? author : null;
}

// Commons keeps the author as HTML, often a link to the user page.
function toPlainText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const text: string = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#\d+|#x[\da-f]+|\w+);/gi, (entity: string, name: string) => decodeEntity(entity, name))
    .replace(/\s+/g, ' ')
    .trim();

  return text ? text.slice(0, MAX_AUTHOR_LENGTH) : null;
}

function decodeEntity(entity: string, name: string): string {
  if (name.startsWith('#')) {
    const code: number = name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : Number(name.slice(1));

    return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
  }

  return HTML_ENTITIES[name.toLowerCase()] ?? entity;
}
