import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { APP_ROUTE_LOCALE_DATA_KEY } from '../constants';
import { LocaleController } from '../state';

// Guards the public pages of one language (the route data has `APP_ROUTE_LOCALE_DATA_KEY`): shows them in that language,
// and moves a visitor who prefers another language from an English URL to the URL in that language.
export const localeRouteGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> =>
  inject(LocaleController).enterRouteLocale(route.data[APP_ROUTE_LOCALE_DATA_KEY], state.url);
