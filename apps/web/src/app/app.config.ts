import { ApplicationConfig, inject, isDevMode, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { provideRouter, TitleStrategy, withAutoCleanupInjectors } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';
import { provideAuth } from '@birthday/web-auth-data-access';
import { BirthdayDialogController } from '@birthday/web-birthdays-data-access';
import { provideBirthdayDialog } from '@birthday/web-birthdays-feature-birthday-dialog';
import { APP_LAYOUT_CONFIG, APP_LAYOUT_PRIMARY_ACTION_HANDLER } from '@birthday/web-layout-util';
import { provideReminders } from '@birthday/web-reminders-data-access';
import { provideI18n } from '@birthday/web-shared-i18n';
import { AnalyticsService, ENVIRONMENT_TOKEN } from '@birthday/web-shared-util';
import { loadAppTranslation } from './app.i18n';
import { APP_LOCALIZED_PATHS, appRoutes } from './app.routes';
import { APP_LAYOUT } from './app.constants';
import { AppPageMetaStrategy } from './app-page-meta.strategy';
import { ThemeController } from './state';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    // Destroys route injectors when their route is left, so route-provided State and Controllers do not outlive the page.
    provideRouter(appRoutes, withAutoCleanupInjectors()),
    { provide: TitleStrategy, useClass: AppPageMetaStrategy },
    provideHttpClient(withFetch()),
    provideI18n({ loadTranslation: loadAppTranslation, localizedPaths: APP_LOCALIZED_PATHS }),
    // Shows birthday push notifications. It caches no files (see `ngsw-config.json`), so every page comes from the network.
    provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode(), registrationStrategy: 'registerWhenStable:5000' }),
    provideAuth(),
    provideReminders(),
    // Applies the saved or system theme and keeps it in sync while the app runs.
    provideAppInitializer(() => {
      inject(ThemeController);
    }),
    provideAppInitializer(() => inject(AnalyticsService).loadTracker()),
    {
      provide: MAT_ICON_DEFAULT_OPTIONS,
      useValue: { fontSet: 'material-symbols-outlined' },
    },
    { provide: APP_LAYOUT_CONFIG, useValue: APP_LAYOUT },
    // The Add birthday dialog opens over the current page.
    provideBirthdayDialog(),
    {
      provide: APP_LAYOUT_PRIMARY_ACTION_HANDLER,
      useFactory: () => {
        const birthdayDialogController: BirthdayDialogController = inject(BirthdayDialogController);

        return () => birthdayDialogController.openAddBirthdayDialog();
      },
    },
    {
      provide: ENVIRONMENT_TOKEN,
      useValue: {
        environmentName: isDevMode() ? 'local' : 'production',
        version: '0.0.0',
        baseUrl: '',
        // Pairs with `VAPID_PRIVATE_KEY` in the API's environment (`npm run push:vapid-keys`).
        vapidPublicKey: 'BA3CPp15GUmhVEZzfQ00PBKGvPCUIdR5OExo9RXEobdrHUf4kMoZNWqpGgOXK_PgJpt365Ph4WNdD7Xru__LdIo',
        // The website in the Umami dashboard (stats.birthdly.com, deploy/README.md, step 9).
        umamiWebsiteId: '41e9c8fb-6e32-4ff5-a291-ad02a7e34eb6',
        notificationErrorTime: 5000,
        notificationSuccessTime: 3000,
      },
    },
  ],
};
