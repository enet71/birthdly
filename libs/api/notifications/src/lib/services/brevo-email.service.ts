import { Inject, Injectable, Logger } from '@nestjs/common';
import { setTimeout as delay } from 'node:timers/promises';
import { AppLocale } from '@birthday/shared-models';
import { MODULE_OPTIONS_TOKEN } from '../notifications.module-definition';
import { AngularPushPayload, NotificationsModuleOptions } from '../types';
import { renderBirthdayEmail } from '../utils/birthday-email';

const SEND_EMAIL_URL = 'https://api.brevo.com/v3/smtp/email';
const SEND_TIMEOUT_MS = 10_000;
const MAX_RETRY_AFTER_SECONDS = 5;

@Injectable()
export class BrevoEmailService {
  private readonly logger = new Logger(BrevoEmailService.name);

  constructor(@Inject(MODULE_OPTIONS_TOKEN) private readonly options: NotificationsModuleOptions) {}

  public get available(): boolean {
    return Boolean(this.options.brevoApiKey && this.options.brevoSenderEmail);
  }

  public async sendBirthdayReminder(email: string, payload: AngularPushPayload, locale: AppLocale): Promise<number> {
    const { appOrigin, brevoApiKey, brevoSenderEmail } = this.options;
    if (!brevoApiKey || !brevoSenderEmail) {
      return 0;
    }

    const { title, body } = payload.notification;
    const requestBody = JSON.stringify({
      sender: { name: 'Birthdly', email: brevoSenderEmail },
      to: [{ email }],
      subject: title,
      htmlContent: renderBirthdayEmail(title, body, locale, appOrigin),
      textContent: `${body}\n\n${appOrigin}/`,
    });
    try {
      const send = () => sendToBrevo(brevoApiKey, requestBody);
      let response = await send();
      const retryAfter = Number(response.headers.get('retry-after') ?? '1');

      // A rate-limit response confirms Brevo rejected the request. A timeout can mean the message was accepted.
      if (response.status === 429 && retryAfter >= 0 && retryAfter <= MAX_RETRY_AFTER_SECONDS) {
        await delay(retryAfter * 1000);
        response = await send();
      }

      if (response.ok) {
        return 1;
      }
      this.logger.warn({ status: response.status }, 'Brevo rejected a birthday email');
    } catch {
      this.logger.warn('Brevo did not confirm a birthday email');
    }
    return 0;
  }
}

async function sendToBrevo(apiKey: string, body: string): Promise<Response> {
  const response = await fetch(SEND_EMAIL_URL, {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json' },
    body,
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    redirect: 'error',
  });
  await response.body?.cancel();
  return response;
}
