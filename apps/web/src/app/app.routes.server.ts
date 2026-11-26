import { RenderMode, ServerRoute } from '@angular/ssr';
import { APP_DEFAULT_LOCALE, APP_LOCALES, AppLocale } from '@birthday/web-shared-i18n';

// The public pages from `buildPublicRoutes` in `app.routes.ts`; each language serves them under its own prefix.
const PUBLIC_SERVER_ROUTES: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Server,
  },
  {
    // The calendar used to live here; a permanent redirect moves its search ranking to the home page.
    path: 'calendar',
    renderMode: RenderMode.Server,
    status: 301,
  },
  { path: 'about', renderMode: RenderMode.Server },
  { path: 'feedback', renderMode: RenderMode.Server },
  { path: 'roadmap', renderMode: RenderMode.Server },
  // Unknown dates under `born` render the not-found page, which sets the 404 status itself.
  { path: 'born/**', renderMode: RenderMode.Server },
  { path: 'guides', renderMode: RenderMode.Server },
  { path: 'guides/google-calendar-birthdays', renderMode: RenderMode.Server },
  { path: 'guides/birthday-reminders', renderMode: RenderMode.Server },
  { path: 'guides/import-birthdays-from-google-contacts', renderMode: RenderMode.Server },
];

function prefixServerRoutes(locale: AppLocale): ServerRoute[] {
  return PUBLIC_SERVER_ROUTES.map((route: ServerRoute) => ({ ...route, path: route.path ? `${locale}/${route.path}` : locale }));
}

// Every page renders on the server for each request, because its language comes from the request (see `LocaleController`).
export const serverRoutes: ServerRoute[] = [
  ...PUBLIC_SERVER_ROUTES,
  ...APP_LOCALES.filter((locale: AppLocale) => locale !== APP_DEFAULT_LOCALE).flatMap(prefixServerRoutes),
  { path: 'privacy', renderMode: RenderMode.Server },
  { path: 'terms', renderMode: RenderMode.Server },
  { path: 'people', renderMode: RenderMode.Server },
  { path: 'people/:id', renderMode: RenderMode.Server },
  { path: 'profile', renderMode: RenderMode.Server },
  { path: 'settings', renderMode: RenderMode.Server },
  { path: 'settings/google-calendar', renderMode: RenderMode.Server },
  { path: 'admin/imports', renderMode: RenderMode.Server },
  { path: 'admin/feedback', renderMode: RenderMode.Server },
  // A dead link renders 404 and an unreachable API 503; `InviteController` sets the status.
  { path: 'invite/:token', renderMode: RenderMode.Server },
  {
    // Unknown URLs render the not-found page with a real 404, so search engines drop them instead of treating them as the home page.
    path: '**',
    renderMode: RenderMode.Server,
    status: 404,
  },
];
