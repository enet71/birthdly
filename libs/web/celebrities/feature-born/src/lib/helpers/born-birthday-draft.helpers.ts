import { CelebrityDto, CelebrityPhotoDto } from '@birthday/shared-models';
import { BirthdayDialogDraft, BirthdayDraftPhoto } from '@birthday/web-birthdays-data-access';
import { BIRTHDAY_NOTES_MAX_LENGTH, UNKNOWN_BIRTH_YEAR } from '@birthday/web-birthdays-util';

// The birthday dialog accepts only 4-digit years, so earlier birth years are left out.
const MIN_KNOWN_BIRTH_YEAR = 1000;
// The API's thumbnails are 120 pixels wide. A stored photo is a 256-pixel square, so a wider thumbnail is downloaded:
// Wikimedia serves only its standard widths, and 330 is the first one whose square side reaches 256.
const THUMBNAIL_WIDTH_PATTERN = /\/120px-/;
const STORED_THUMBNAIL_WIDTH = '/330px-';

// A new birthday prefilled from a celebrity; the user can change every field before saving.
export function toCelebrityBirthdayDraft(celebrity: CelebrityDto): BirthdayDialogDraft {
  return {
    name: celebrity.name,
    birthDate: toDraftBirthDate(celebrity.birthDate),
    relationship: 'celebrity',
    notes: toDraftNotes(celebrity.wikipediaUrl),
    photo: celebrity.photo && toDraftPhoto(celebrity.photo),
  };
}

// The wider thumbnail fails for images narrower than it; the API's thumbnail is the fallback.
function toDraftPhoto({ url }: CelebrityPhotoDto): BirthdayDraftPhoto {
  const widerUrl: string = url.replace(THUMBNAIL_WIDTH_PATTERN, STORED_THUMBNAIL_WIDTH);

  return { previewUrl: url, sourceUrls: widerUrl === url ? [url] : [widerUrl, url] };
}

function toDraftBirthDate(birthDate: string): string {
  const year = Number(birthDate.slice(0, 4));

  return year < MIN_KNOWN_BIRTH_YEAR ? `${String(UNKNOWN_BIRTH_YEAR).padStart(4, '0')}${birthDate.slice(4)}` : birthDate;
}

function toDraftNotes(wikipediaUrl: string | null): string | null {
  if (!wikipediaUrl) {
    return null;
  }

  const url: string = toReadableUrl(wikipediaUrl);

  // UTF-16 length, as the dialog counts it.
  return url.length <= BIRTHDAY_NOTES_MAX_LENGTH ? url : null;
}

// Notes are plain text, so the link is shown with its letters rather than percent codes. A title with `?`, `#` or `%`
// keeps its encoded form, because decoding it would change where the link leads.
function toReadableUrl(url: string): string {
  const decoded: string = decodeURIComponent(url);

  return /[?#%]/.test(decoded) ? url : decoded;
}
