import { CelebrityDto } from '@birthday/shared-models';
import { BirthdayDialogDraft } from '@birthday/web-birthdays-data-access';
import { toCelebrityBirthdayDraft } from './born-birthday-draft.helpers';

const THUMBNAIL_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Ada.jpg/120px-Ada.jpg';
const CELEBRITY = {
  id: 'Q7259',
  name: 'Ada Lovelace',
  birthDate: '1815-12-10',
  wikipediaUrl: 'https://en.wikipedia.org/wiki/Ada_Lovelace',
  photo: { url: THUMBNAIL_URL },
} as CelebrityDto;

function withWikipediaUrl(wikipediaUrl: string | null): CelebrityDto {
  return { ...CELEBRITY, wikipediaUrl };
}

describe('toCelebrityBirthdayDraft', () => {
  it('takes the name and marks the person as a celebrity', () => {
    const draft: BirthdayDialogDraft = toCelebrityBirthdayDraft(CELEBRITY);

    expect(draft.name).toBe('Ada Lovelace');
    expect(draft.relationship).toBe('celebrity');
  });

  it('keeps a birth date with a 4-digit year', () => {
    expect(toCelebrityBirthdayDraft(CELEBRITY).birthDate).toBe('1815-12-10');
  });

  it('replaces a year before 1000 with the unknown-year marker', () => {
    expect(toCelebrityBirthdayDraft({ ...CELEBRITY, birthDate: '0570-04-26' }).birthDate).toBe('0004-04-26');
  });

  it('keeps February 29 when the year before 1000 is replaced', () => {
    expect(toCelebrityBirthdayDraft({ ...CELEBRITY, birthDate: '0500-02-29' }).birthDate).toBe('0004-02-29');
  });

  describe('notes', () => {
    it('hold the Wikipedia link with its title decoded', () => {
      const draft: BirthdayDialogDraft = toCelebrityBirthdayDraft(
        withWikipediaUrl('https://ru.wikipedia.org/wiki/%D0%93%D0%B0%D0%B3%D0%B0%D1%80%D0%B8%D0%BD'),
      );

      expect(draft.notes).toBe('https://ru.wikipedia.org/wiki/Гагарин');
    });

    it.each([
      ['?', 'https://en.wikipedia.org/wiki/Who%3F_(film)'],
      ['#', 'https://en.wikipedia.org/wiki/C%23_(programming_language)'],
      ['%', 'https://en.wikipedia.org/wiki/100%25_%D0%90'],
    ])('keep the encoded link when the title contains %s', (_, url: string) => {
      expect(toCelebrityBirthdayDraft(withWikipediaUrl(url)).notes).toBe(url);
    });

    it('are empty without a Wikipedia link', () => {
      expect(toCelebrityBirthdayDraft(withWikipediaUrl(null)).notes).toBeNull();
    });

    it('keep a link of exactly 500 characters', () => {
      const url = `https://en.wikipedia.org/wiki/${'a'.repeat(470)}`;

      expect(toCelebrityBirthdayDraft(withWikipediaUrl(url)).notes).toBe(url);
    });

    it('are empty when the readable link is longer than 500 UTF-16 code units', () => {
      // 236 characters outside the BMP take 472 UTF-16 code units; with the prefix the link takes 502.
      const url = `https://en.wikipedia.org/wiki/${encodeURIComponent('𝔸'.repeat(236))}`;

      expect(toCelebrityBirthdayDraft(withWikipediaUrl(url)).notes).toBeNull();
    });
  });

  describe('photo', () => {
    it('is empty when the celebrity has no photo', () => {
      expect(toCelebrityBirthdayDraft({ ...CELEBRITY, photo: null }).photo).toBeNull();
    });

    it('tries the 330-pixel thumbnail first and falls back to the 120-pixel one', () => {
      expect(toCelebrityBirthdayDraft(CELEBRITY).photo).toEqual({
        previewUrl: THUMBNAIL_URL,
        sourceUrls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Ada.jpg/330px-Ada.jpg', THUMBNAIL_URL],
      });
    });

    it('uses only the photo URL when it is not a 120-pixel thumbnail', () => {
      const url = 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Ada.jpg';

      expect(toCelebrityBirthdayDraft({ ...CELEBRITY, photo: { url } } as CelebrityDto).photo).toEqual({ previewUrl: url, sourceUrls: [url] });
    });
  });
});
