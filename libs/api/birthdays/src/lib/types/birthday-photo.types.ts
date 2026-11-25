// The part of an uploaded multipart file that the API reads; multer keeps it in memory.
export interface UploadedPhoto {
  buffer: Buffer;
}
