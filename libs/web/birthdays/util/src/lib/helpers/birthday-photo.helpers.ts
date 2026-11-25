const PHOTO_SIZE_PX = 256;
const PHOTO_TYPE = 'image/webp';
const PHOTO_QUALITY = 0.85;
// The part of a portrait photo's extra height left above the square. Faces are usually in the upper third, so a centred
// square often cuts the head; a landscape photo stays centred horizontally.
const PORTRAIT_CROP_TOP_SHARE = 0.25;

// A larger file is refused before decoding: a decoded image takes far more memory than its file.
export const BIRTHDAY_PHOTO_SOURCE_MAX_MB = 20;

// The browser decodes the image but cannot encode WebP, as Safari does.
export class WebpNotSupportedError extends Error {
  constructor() {
    super('The browser cannot encode WebP');
  }
}

export class PhotoTooLargeError extends Error {
  constructor() {
    super(`The image is larger than ${BIRTHDAY_PHOTO_SOURCE_MAX_MB} MB`);
  }
}

// Cuts a square out of an image (centred, or nearer the top of a portrait photo) and encodes it as a 256×256 WebP.
// Rejects with `PhotoTooLargeError` for a file over `BIRTHDAY_PHOTO_SOURCE_MAX_MB`, when the browser cannot decode the
// image (for example HEIC outside Safari), and with `WebpNotSupportedError` when it cannot encode WebP (Safari falls
// back to PNG).
export async function toBirthdayPhoto(image: Blob): Promise<Blob> {
  if (image.size > BIRTHDAY_PHOTO_SOURCE_MAX_MB * 1024 * 1024) {
    throw new PhotoTooLargeError();
  }
  // Phone photos keep their rotation in EXIF.
  const bitmap: ImageBitmap = await createImageBitmap(image, { imageOrientation: 'from-image' });

  try {
    const side: number = Math.min(bitmap.width, bitmap.height);
    const canvas: HTMLCanvasElement = document.createElement('canvas');

    canvas.width = PHOTO_SIZE_PX;
    canvas.height = PHOTO_SIZE_PX;
    const context: CanvasRenderingContext2D | null = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas 2D is not available');
    }
    context.imageSmoothingQuality = 'high';
    context.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) * PORTRAIT_CROP_TOP_SHARE,
      side,
      side,
      0,
      0,
      PHOTO_SIZE_PX,
      PHOTO_SIZE_PX,
    );

    const photo: Blob | null = await new Promise((resolve: (blob: Blob | null) => void) => canvas.toBlob(resolve, PHOTO_TYPE, PHOTO_QUALITY));

    if (photo?.type !== PHOTO_TYPE) {
      throw new WebpNotSupportedError();
    }
    return photo;
  } finally {
    bitmap.close();
  }
}
