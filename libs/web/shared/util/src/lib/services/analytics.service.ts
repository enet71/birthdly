import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Environment, ENVIRONMENT_TOKEN } from '../environment';
import { AnalyticsEvent, AnalyticsEventData } from '../types';

// Served from the site's own origin by Caddy (deploy/Caddyfile); the tracker sends events next to it, to /m/e.
const TRACKER_SRC = '/m/m.js';
// Other hosts, such as localhost running a production build, have no tracker behind /m/.
const TRACKED_HOSTNAME = 'birthdly.com';
// The tracker calls a function on `window` by this name before sending each payload.
const BEFORE_SEND_NAME = 'birthdlyAnalyticsBeforeSend';
// Invite links carry a secret token in the path, and their page title names the link's owner; neither may reach the
// analytics.
const INVITE_PATH_PATTERN = /\/invite\/[^/?#]+/g;
const REDACTED_INVITE_PATH = '/invite/:token';

interface UmamiTracker {
  track(event: string, data?: AnalyticsEventData): void;
}

// Self-hosted Umami: page views, including SPA navigations, are tracked by its script; key events go through `track`.
// Nothing is loaded or sent while rendering on the server, in development, on other hosts, or without a website ID.
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly document: Document = inject(DOCUMENT);
  private readonly environment: Environment = inject(ENVIRONMENT_TOKEN);
  private readonly isBrowser: boolean = isPlatformBrowser(inject(PLATFORM_ID));

  public loadTracker(): void {
    const websiteId: string | null = this.environment.umamiWebsiteId;
    const view: Window | null = this.document.defaultView;

    if (!this.isBrowser || this.environment.environmentName !== 'production' || !websiteId || view?.location.hostname !== TRACKED_HOSTNAME) {
      return;
    }

    Object.assign(view, { [BEFORE_SEND_NAME]: redactPayload });

    const script: HTMLScriptElement = this.document.createElement('script');

    script.src = TRACKER_SRC;
    script.defer = true;
    script.dataset['websiteId'] = websiteId;
    script.dataset['beforeSend'] = BEFORE_SEND_NAME;
    this.document.head.appendChild(script);
  }

  // Dropped while the tracker is not loaded, for example when an ad blocker stops it.
  public track(event: AnalyticsEvent, data?: AnalyticsEventData): void {
    this.getTracker()?.track(event, data);
  }

  private getTracker(): UmamiTracker | undefined {
    return (this.document.defaultView as (Window & { umami?: UmamiTracker }) | null)?.umami;
  }
}

function redactPayload(_type: string, payload: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = Object.fromEntries(
    Object.entries(payload).map(([key, value]: [string, unknown]) => [
      key,
      typeof value === 'string' ? value.replace(INVITE_PATH_PATTERN, REDACTED_INVITE_PATH) : value,
    ]),
  );
  const isInvitePage: boolean = typeof redacted['url'] === 'string' && redacted['url'].includes(REDACTED_INVITE_PATH);

  return isInvitePage ? { ...redacted, title: '' } : redacted;
}
