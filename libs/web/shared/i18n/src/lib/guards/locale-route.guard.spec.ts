import type { Mock } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { APP_ROUTE_LOCALE_DATA_KEY } from '../constants';
import { LocaleController } from '../state';
import { localeRouteGuard } from './locale-route.guard';

describe('localeRouteGuard', () => {
  const localeController: { enterRouteLocale: Mock<LocaleController['enterRouteLocale']> } = {
    enterRouteLocale: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [{ provide: LocaleController, useValue: localeController }],
    });
  });

  it('enters the language of the route data with the target URL', () => {
    const entered: Observable<boolean | UrlTree> = of(true);
    localeController.enterRouteLocale.mockReturnValue(entered);
    const route = { data: { [APP_ROUTE_LOCALE_DATA_KEY]: 'de' } } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/de/about?x=1' } as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => localeRouteGuard(route, state));

    expect(localeController.enterRouteLocale).toHaveBeenCalledWith('de', '/de/about?x=1');
    expect(result).toBe(entered);
  });
});
