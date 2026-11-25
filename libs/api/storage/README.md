# api-storage

`StorageModule` (global) and `PhotoStorageService`: people's photos in a private Cloudflare R2 bucket, reached through
the S3 API (`@aws-sdk/client-s3`).

`apps/api` configures it from `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` and `R2_BUCKET`: all four or
none. Without them (`r2: null`) `isEnabled` is `false`; `api-birthdays` then answers `photoUrl: null` and 503 for the
photo requests, and `delete` does nothing. The token needs Object Read & Write on that bucket only. The bucket needs no
public access and no CORS: uploads go through the API.

- `put` stores an object with `Cache-Control: private, max-age=172800, immutable`. Callers never overwrite an object:
  `api-birthdays` gives every photo a new key, `users/<userId>/birthdays/<birthdayId>/<uuid>.webp`.
- `getUrl` returns a presigned GET URL signed at the start of the UTC day and valid for 48 hours, so the URL of a photo
  stays the same all day (browsers reuse the cached image) and every URL handed out works for at least a day.
- `delete` never throws: a failed delete is logged and only leaves an unreachable object behind.
