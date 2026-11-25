import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { MODULE_OPTIONS_TOKEN } from '../storage.module-definition';
import { StorageModuleOptions } from '../types';

const DAY_SECONDS = 24 * 60 * 60;
// A photo object never changes: a new photo gets a new key.
const PHOTO_CACHE_CONTROL = `private, max-age=${2 * DAY_SECONDS}, immutable`;

// Keeps photos in a private Cloudflare R2 bucket; browsers read them through presigned URLs.
@Injectable()
export class PhotoStorageService {
  private readonly logger = new Logger(PhotoStorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;

  constructor(@Inject(MODULE_OPTIONS_TOKEN) options: StorageModuleOptions) {
    this.bucket = options.r2?.bucket ?? '';
    this.client = options.r2
      ? new S3Client({
          region: 'auto',
          endpoint: `https://${options.r2.accountId}.r2.cloudflarestorage.com`,
          credentials: { accessKeyId: options.r2.accessKeyId, secretAccessKey: options.r2.secretAccessKey },
          // R2 does not support every checksum the SDK adds by default.
          requestChecksumCalculation: 'WHEN_REQUIRED',
          responseChecksumValidation: 'WHEN_REQUIRED',
        })
      : null;
  }

  public get isEnabled(): boolean {
    return this.client !== null;
  }

  public async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.getClient().send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType, CacheControl: PHOTO_CACHE_CONTROL }),
    );
  }

  // Never throws: a failed delete only leaves an unreachable object behind, which must not fail the caller's change.
  public async delete(key: string): Promise<void> {
    if (!this.client) {
      return;
    }
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (error) {
      this.logger.error({ err: error, key }, 'Failed to delete a photo');
    }
  }

  // The URL is signed at the start of the UTC day and lives two days, so it stays the same all day and browsers reuse
  // the cached photo, while every URL handed out stays valid for at least a day.
  public getUrl(key: string): Promise<string> {
    const signingDate = new Date();

    signingDate.setUTCHours(0, 0, 0, 0);
    return getSignedUrl(this.getClient(), new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: 2 * DAY_SECONDS,
      signingDate,
    });
  }

  private getClient(): S3Client {
    if (!this.client) {
      throw new Error('The photo storage is not configured');
    }
    return this.client;
  }
}
