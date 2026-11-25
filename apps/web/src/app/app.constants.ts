import { AppLayoutConfig } from '@birthday/web-layout-util';
import { AppLocale } from '@birthday/web-shared-i18n';
import { AppTheme, AppThemePreference } from './app.interfaces';

export const APP_SITE_URL = 'https://birthdly.com';

// Translation key of the description for pages without their own; its English text matches the description tags in `index.html`.
export const APP_DEFAULT_DESCRIPTION = 'app.description';

export const APP_OPEN_GRAPH_LOCALES: Record<AppLocale, string> = {
  en: 'en_US',
  es: 'es_ES',
  de: 'de_DE',
  fr: 'fr_FR',
  ru: 'ru_RU',
  uk: 'uk_UA',
};

// Labels are translation keys; the layout translates them.
export const APP_LAYOUT: AppLayoutConfig = {
  appName: 'Birthdly',
  homePath: '/',
  logo: { src: '/assets/images/logo-1.svg', width: 124, height: 40 },
  logoSmall: { src: '/assets/images/logo-2.svg', width: 41, height: 40 },
  menu: [
    {
      label: 'nav.calendar',
      path: '/',
      icon: 'calendar_month',
    },
    {
      label: 'nav.people',
      path: '/people',
      icon: 'group',
    },
    {
      label: 'nav.celebrities',
      path: '/born',
      icon: 'star',
    },
  ],
  secondaryMenu: [
    {
      label: 'nav.settings',
      path: '/settings',
      icon: 'settings',
    },
    {
      label: 'nav.feedback',
      path: '/feedback',
      icon: 'feedback',
    },
    {
      label: 'nav.roadmap',
      path: '/roadmap',
      icon: 'route',
    },
  ],
  primaryAction: {
    label: 'nav.addBirthday',
    icon: 'add',
  },
  // Google OAuth branding requires the app name and the legal links on the home page.
  footer: {
    tagline: 'footer.tagline',
    links: [
      { label: 'footer.about', path: '/about' },
      { label: 'footer.guides', path: '/guides' },
      { label: 'footer.feedback', path: '/feedback' },
      { label: 'footer.roadmap', path: '/roadmap' },
      { label: 'footer.privacy', shortLabel: 'footer.privacyShort', path: '/privacy' },
      { label: 'footer.terms', shortLabel: 'footer.termsShort', path: '/terms' },
    ],
  },
};

// Narrow screens, where the layout shows the bottom navigation instead of the sidenav (`app-layout.component.scss`).
export const APP_COMPACT_LAYOUT_QUERY = '(max-width: 48rem)';

// Also used by the inline script in `index.html`.
export const APP_DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

export const APP_THEME_PREFERENCES: readonly AppThemePreference[] = ['system', 'light', 'dark'];

// Browser UI color per theme: the canvas color. The inline script in `index.html` repeats these values.
export const APP_THEME_COLORS: Record<AppTheme, string> = {
  light: '#fdf8ff',
  dark: '#0c0e1b',
};
