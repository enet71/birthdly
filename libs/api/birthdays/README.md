# api-birthdays

`/api/birthdays`: the signed-in user's birthdays.

| Request                           | Answer                                                                  |
| --------------------------------- | ----------------------------------------------------------------------- |
| `GET /api/birthdays`              | `BirthdayDto[]` in the order they were added                            |
| `POST /api/birthdays`             | 201 and the created `BirthdayDto`                                       |
| `PATCH /api/birthdays/:id`        | The updated `BirthdayDto`; 404 for a missing or another user's birthday |
| `DELETE /api/birthdays/:id`       | 204, also when the birthday is already gone                             |
| `PUT /api/birthdays/:id/photo`    | The `BirthdayDto` with the new `photoUrl`                               |
| `DELETE /api/birthdays/:id/photo` | The `BirthdayDto` with `photoUrl: null`                                 |

The request bodies are the `CreateBirthdayRequest` and `UpdateBirthdayRequest` of `@birthday/shared-models`. The zod
schemas in `src/lib/schemas` apply the same limits as the database checks and reject unknown fields, such as the
Google links, which only the Google sync sets. A body that fails them is answered with 400 by the API's
`ZodExceptionFilter`.

Every query filters by the signed-in user: the API has no row-level security.

## Photos

`PUT /api/birthdays/:id/photo` takes `multipart/form-data` with one file in the `photo` field: a WebP image of at most
300 KB (`BIRTHDAY_PHOTO_MAX_BYTES`), checked by its `RIFF…WEBP` signature. It answers 400 for a missing or non-WebP
file, 413 for a larger one, and 404 for a missing or another user's birthday. Both photo requests answer 503 when the
API runs without R2 (`api-storage`).

`photoUrl` in `BirthdayDto` is a presigned link that works for at least a day; the web app gets fresh links with every
list. A new photo gets a new object key, and the replaced, removed or deleted person's object is deleted from R2, also
when the Google sync deletes the person. Changing the photo keeps `updated_at`, which the Google sync compares with
changes in Google.
