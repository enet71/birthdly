import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  convertToParamMap,
  Data,
  GuardResult,
  MaybeAsync,
  Params,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { APP_ROUTE_LOCALE_DATA_KEY } from '@birthday/web-shared-i18n';
import { bornYearGuard } from './born-year.guard';

describe('bornYearGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  // The date route under the public routes of a language; English routes carry `en`.
  function createRoute(date: Params, queryParams: Params, localeData: Data): ActivatedRouteSnapshot {
    const route = {
      data: {},
      paramMap: convertToParamMap(date),
      queryParams,
      queryParamMap: convertToParamMap(queryParams),
    } as ActivatedRouteSnapshot;

    return { ...route, pathFromRoot: [{ data: {} }, { data: localeData }, route] } as unknown as ActivatedRouteSnapshot;
  }

  function runGuard(route: ActivatedRouteSnapshot): MaybeAsync<GuardResult> {
    return TestBed.runInInjectionContext(() => bornYearGuard(route, {} as RouterStateSnapshot));
  }

  function serialize(result: MaybeAsync<GuardResult>): string {
    expect(result).toBeInstanceOf(UrlTree);

    return TestBed.inject(Router).serializeUrl(result as UrlTree);
  }

  it('removes a year the date does not exist in from a localized URL, keeping the other filters', () => {
    const route: ActivatedRouteSnapshot = createRoute(
      { month: 'february', day: '29' },
      { year: '2001', country: 'us,ua' },
      { [APP_ROUTE_LOCALE_DATA_KEY]: 'de' },
    );

    expect(serialize(runGuard(route))).toBe('/de/born/february/29?country=us,ua');
  });

  it('removes an invalid year from an English URL without a prefix', () => {
    const route: ActivatedRouteSnapshot = createRoute(
      { month: 'march', day: '3' },
      { year: 'abc', status: 'living' },
      { [APP_ROUTE_LOCALE_DATA_KEY]: 'en' },
    );

    expect(serialize(runGuard(route))).toBe('/born/march/3?status=living');
  });

  it('keeps a year the date exists in', () => {
    const route: ActivatedRouteSnapshot = createRoute({ month: 'february', day: '29' }, { year: '2000' }, { [APP_ROUTE_LOCALE_DATA_KEY]: 'de' });

    expect(runGuard(route)).toBe(true);
  });

  it('lets a URL without a year through', () => {
    const route: ActivatedRouteSnapshot = createRoute({ month: 'march', day: '3' }, {}, { [APP_ROUTE_LOCALE_DATA_KEY]: 'fr' });

    expect(runGuard(route)).toBe(true);
  });
});
