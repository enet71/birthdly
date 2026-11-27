import { z } from 'zod';

// An empty value, such as `R2_BUCKET=` in `.env`, counts as unset.
function optionalSetting<T extends z.ZodType>(schema: T) {
  return z.preprocess((value: unknown) => (value === '' ? undefined : value), schema.optional());
}

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  // The web app's origin, for example `https://birthdly.com`. Google returns signed-in users to it, and requests that
  // change something must come from it.
  APP_ORIGIN: z
    .url({ protocol: /^https?$/ })
    .refine((value: string) => new URL(value).origin === value, { message: 'Must be an origin without a path, such as https://birthdly.com' }),
  // The OAuth client in Google Cloud Console.
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  // Encrypts the sign-in cookie. Generate it with `openssl rand -hex 32`.
  AUTH_SECRET: z.string().min(32),
  // Encrypts the saved Google Calendar refresh tokens (AES-256). Generate it with `openssl rand -hex 32`; changing it
  // makes every saved connection unusable, so users have to connect Google Calendar again.
  GOOGLE_TOKEN_ENCRYPTION_KEY: z.string().regex(/^[0-9a-f]{64}$/i, { message: 'Must be 64 hex characters: openssl rand -hex 32' }),
  // Ends the ids of the Google Calendar events this installation creates, so installations sharing a Google account do
  // not remove each other's events. Every installation needs its own tag. Production's is empty (set in
  // deploy/compose.yml): its events were created before the tag existed, and any other value would recreate them all.
  GOOGLE_CALENDAR_EVENT_TAG: z.string().regex(/^[0-9a-v]{0,8}$/, { message: 'Must be up to 8 characters from 0-9 and a-v' }),
  // The VAPID key pair that signs birthday push notifications, from `npm run push:vapid-keys`. The public key must equal
  // `vapidPublicKey` in the web app; a new pair makes every existing browser subscription stop working.
  VAPID_PUBLIC_KEY: z.string().regex(/^[A-Za-z0-9_-]{87}$/, { message: 'Must be the base64url public key from npm run push:vapid-keys' }),
  VAPID_PRIVATE_KEY: z.string().regex(/^[A-Za-z0-9_-]{43}$/, { message: 'Must be the base64url private key from npm run push:vapid-keys' }),
  // How push services can reach the sender, for example `mailto:hello@birthdly.com`.
  VAPID_SUBJECT: z.string().regex(/^(mailto:|https:\/\/)/, { message: 'Must be a mailto: or https: URL' }),
  BREVO_API_KEY: optionalSetting(z.string().trim().min(1)),
  BREVO_SENDER_EMAIL: optionalSetting(z.email()),
  // Comma-separated emails of the users who see the admin pages, for example `me@example.com,you@example.com`; empty or
  // unset means nobody.
  ADMIN_EMAILS: z
    .string()
    .default('')
    .transform((value: string) =>
      value
        .split(',')
        .map((email: string) => email.trim().toLowerCase())
        .filter(Boolean),
    )
    .pipe(z.array(z.email())),
  // The Cloudflare R2 bucket for people's photos and an API token with Object Read & Write on it. Either all four or
  // none (`hasAllOrNoR2Settings`): without them, or with them empty, the API turns photos off.
  R2_ACCOUNT_ID: optionalSetting(z.string().regex(/^[0-9a-f]{32}$/, { message: 'Must be the 32-character Cloudflare account ID' })),
  R2_ACCESS_KEY_ID: optionalSetting(z.string()),
  R2_SECRET_ACCESS_KEY: optionalSetting(z.string()),
  R2_BUCKET: optionalSetting(z.string()),
  // `false` keeps this API from importing celebrities from Wikimedia, for example in local development, where an import
  // shares Wikimedia's rate limit with production.
  CELEBRITY_IMPORT_ENABLED: optionalSetting(z.stringbool()).default(true),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

// Used by `ConfigModule`, so the app stops at startup instead of failing on the first request that needs a setting.
export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema
    .refine((env) => Boolean(env.BREVO_API_KEY) === Boolean(env.BREVO_SENDER_EMAIL), {
      message: 'Set both BREVO_API_KEY and BREVO_SENDER_EMAIL, or neither',
      path: ['BREVO_SENDER_EMAIL'],
    })
    .refine(hasAllOrNoR2Settings, {
      message: 'Set all of R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET, or none of them',
      path: ['R2_BUCKET'],
    })
    .safeParse(config);

  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }

  return result.data;
}

function hasAllOrNoR2Settings(env: Env): boolean {
  const settings = [env.R2_ACCOUNT_ID, env.R2_ACCESS_KEY_ID, env.R2_SECRET_ACCESS_KEY, env.R2_BUCKET];

  return settings.every((value?: string) => value !== undefined) || settings.every((value?: string) => value === undefined);
}
