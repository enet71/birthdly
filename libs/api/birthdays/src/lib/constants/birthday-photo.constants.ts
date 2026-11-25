// The web app sends a 256×256 WebP of a few tens of kilobytes; the limit leaves room for a detailed photo.
export const BIRTHDAY_PHOTO_MAX_BYTES = 300 * 1024;
// The multipart field that carries the photo.
export const BIRTHDAY_PHOTO_FIELD = 'photo';
export const BIRTHDAY_PHOTO_CONTENT_TYPE = 'image/webp';
