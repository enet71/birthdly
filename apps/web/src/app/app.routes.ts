import { Route } from '@angular/router';
import { APP_LAYOUT_HEADING_DATA_KEY } from '@birthday/web-layout-util';
import { APP_DEFAULT_LOCALE, APP_LOCALES, APP_ROUTE_LOCALE_DATA_KEY, AppLocale, localeRouteGuard } from '@birthday/web-shared-i18n';
import { APP_DESCRIPTION_DATA_KEY, APP_DOCUMENT_TITLE_DATA_KEY, APP_NOINDEX_DATA_KEY, APP_STRUCTURED_DATA_DATA_KEY } from '@birthday/web-shared-util';
import { buildAboutFaqStructuredData } from './pages/about/about.helpers';

// Titles, headings, and descriptions are translation keys; `AppPageMetaStrategy` and the layout translate them.

// Public pages that search engines index have a URL per language: English without a prefix, the others under `/<locale>`.
// Each language gets its own copy of these routes; every page also needs entries in `app.routes.server.ts` and in the sitemap
// (`MAIN_PAGES` in `sitemap.ts`).
function buildPublicRoutes(): Route[] {
  return [
    {
      path: '',
      pathMatch: 'full',
      title: 'routes.calendar.title',
      data: {
        [APP_DOCUMENT_TITLE_DATA_KEY]: 'routes.calendar.documentTitle',
        [APP_LAYOUT_HEADING_DATA_KEY]: 'routes.calendar.heading',
      },
      loadChildren: () => import('@birthday/web-birthdays-feature-calendar').then((m) => m.CALENDAR_ROUTES),
    },
    {
      path: 'about',
      title: 'routes.about.title',
      data: {
        [APP_DOCUMENT_TITLE_DATA_KEY]: 'routes.about.documentTitle',
        [APP_LAYOUT_HEADING_DATA_KEY]: 'routes.about.heading',
        [APP_DESCRIPTION_DATA_KEY]: 'routes.about.description',
        [APP_STRUCTURED_DATA_DATA_KEY]: buildAboutFaqStructuredData,
      },
      loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent),
    },
    {
      path: 'feedback',
      title: 'routes.feedback.title',
      data: {
        [APP_DOCUMENT_TITLE_DATA_KEY]: 'routes.feedback.documentTitle',
        [APP_LAYOUT_HEADING_DATA_KEY]: 'routes.feedback.heading',
        [APP_DESCRIPTION_DATA_KEY]: 'routes.feedback.description',
      },
      loadChildren: () => import('@birthday/web-feedback-feature-feedback').then((m) => m.FEEDBACK_ROUTES),
    },
    {
      path: 'roadmap',
      title: 'routes.roadmap.title',
      data: {
        [APP_DOCUMENT_TITLE_DATA_KEY]: 'routes.roadmap.documentTitle',
        [APP_LAYOUT_HEADING_DATA_KEY]: 'routes.roadmap.heading',
        [APP_DESCRIPTION_DATA_KEY]: 'routes.roadmap.description',
      },
      loadChildren: () => import('@birthday/web-roadmap-feature-roadmap').then((m) => m.ROADMAP_ROUTES),
    },
    { path: 'calendar', redirectTo: '' },
    {
      // Indexed; the date pages are listed in `sitemap-born.xml` (`sitemap.ts`), and filtered URLs point to the date page as canonical.
      path: 'born',
      loadChildren: () => import('@birthday/web-celebrities-feature-born').then((m) => m.BORN_ROUTES),
    },
    {
      path: 'guides',
      loadChildren: () => import('./pages/guides/guides.routes').then((m) => m.GUIDES_ROUTES),
    },
  ];
}

// The first path segments of the public pages, for the links that keep the current language (`LocalizedPathService`) and the
// sitemap's language versions.
export const APP_LOCALIZED_PATHS: readonly string[] = buildPublicRoutes().map((route: Route) => route.path ?? '');

function buildLocaleRoute(locale: AppLocale): Route {
  return {
    path: locale === APP_DEFAULT_LOCALE ? '' : locale,
    data: { [APP_ROUTE_LOCALE_DATA_KEY]: locale },
    canActivate: [localeRouteGuard],
    children: buildPublicRoutes(),
  };
}

// The other pages have one URL for every language, and their language comes from the cookie or the browser.
export const appRoutes: Route[] = [
  // English has no prefix, so it goes last and does not try to match `/de/...`.
  ...APP_LOCALES.filter((locale: AppLocale) => locale !== APP_DEFAULT_LOCALE).map(buildLocaleRoute),
  buildLocaleRoute(APP_DEFAULT_LOCALE),
  {
    // The legal texts exist only in English, so they keep one URL; only their titles follow the language.
    path: 'privacy',
    title: 'routes.privacy.title',
    data: {
      [APP_DESCRIPTION_DATA_KEY]: 'routes.privacy.description',
    },
    loadComponent: () => import('./pages/legal/privacy/privacy.component').then((m) => m.PrivacyComponent),
  },
  {
    path: 'terms',
    title: 'routes.terms.title',
    data: {
      [APP_DESCRIPTION_DATA_KEY]: 'routes.terms.description',
    },
    loadComponent: () => import('./pages/legal/terms/terms.component').then((m) => m.TermsComponent),
  },
  {
    path: 'people',
    title: 'routes.people.title',
    data: { [APP_NOINDEX_DATA_KEY]: true },
    loadChildren: () => import('@birthday/web-birthdays-feature-people').then((m) => m.PEOPLE_ROUTES),
  },
  {
    path: 'profile',
    title: 'routes.profile.title',
    data: { [APP_NOINDEX_DATA_KEY]: true },
    loadChildren: () => import('./pages/profile/profile.routes').then((m) => m.PROFILE_ROUTES),
  },
  {
    path: 'settings',
    title: 'routes.settings.title',
    data: { [APP_NOINDEX_DATA_KEY]: true },
    loadChildren: () => import('./pages/settings/settings.routes').then((m) => m.SETTINGS_ROUTES),
  },
  {
    // Google Calendar consent used to return here; a link from before the popup still lands in Settings.
    path: 'settings/google-calendar',
    redirectTo: 'settings',
  },
  {
    // Only for the admins listed in the API's `ADMIN_EMAILS`; everyone else sees "Page not found". Not in the menu; the
    // page itself is English only.
    path: 'admin/imports',
    title: 'routes.adminImports.title',
    data: { [APP_NOINDEX_DATA_KEY]: true },
    loadChildren: () => import('@birthday/web-admin-feature-imports').then((m) => m.ADMIN_IMPORTS_ROUTES),
  },
  {
    // Like `admin/imports`: only for the API's `ADMIN_EMAILS`, not in the menu, English only.
    path: 'admin/feedback',
    title: 'routes.adminFeedback.title',
    data: { [APP_NOINDEX_DATA_KEY]: true },
    loadChildren: () => import('@birthday/web-admin-feature-feedback').then((m) => m.ADMIN_FEEDBACK_ROUTES),
  },
  {
    // Guests open `/invite/<token>` from a link someone shared; not indexed.
    path: 'invite',
    loadChildren: () => import('@birthday/web-invites-feature-invite').then((m) => m.INVITE_ROUTES),
  },
  {
    path: '**',
    title: 'routes.notFound.title',
    data: { [APP_NOINDEX_DATA_KEY]: true },
    loadComponent: () => import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
