// A Cloudflare R2 bucket and an API token that can read and write its objects.
export interface R2Options {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

export interface StorageModuleOptions {
  // `null` turns the photo storage off, for example in local development without a bucket.
  r2: R2Options | null;
}
