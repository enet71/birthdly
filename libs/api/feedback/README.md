# api-feedback

The feedback form: anyone can send a message, and the admins read the newest ones.

| Request                   | Who    | Answer                                                             |
| ------------------------- | ------ | ------------------------------------------------------------------ |
| `POST /api/feedback`      | anyone | `CreateFeedbackRequest` → 204                                      |
| `GET /api/admin/feedback` | admin  | `FeedbackDto[]`, newest first, at most `FEEDBACK_ADMIN_LIST_LIMIT` |

`POST /api/feedback` is `@OptionalAuth()`: a signed-in sender's message gets the account's `user_id`, and deleting the
account deletes it. The API also stores the `User-Agent` header, cut to 500 characters.

Spam protection:

- `website` is a honeypot the form hides; a message that fills it answers 204 and is dropped.
- `FEEDBACK_THROTTLES` limit messages per IP address (429). They reuse the throttlers that `api-invites` registers with
  `ThrottlerModule`, and count in memory, which is enough for the single API instance.
