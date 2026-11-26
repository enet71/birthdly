import { TestBed } from '@angular/core/testing';
import { LocaleState } from '../state/locale.state';
import { I18N_OPTIONS } from '../tokens';
import { LocalizedPathService } from './localized-path.service';

describe('LocalizedPathService', () => {
  let service: LocalizedPathService;
  let state: LocaleState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: I18N_OPTIONS, useValue: { loadTranslation: vi.fn(), localizedPaths: ['', 'about', 'born'] } }],
    });

    service = TestBed.inject(LocalizedPathService);
    state = TestBed.inject(LocaleState);
  });

  it('leaves public paths unprefixed in English', () => {
    expect(service.localize('/about')).toBe('/about');
  });

  it.each([
    ['/', '/de'],
    ['/about', '/de/about'],
    ['/born/march/3?year=1990', '/de/born/march/3?year=1990'],
  ])('prefixes the public path %s with the current language', (path: string, localized: string) => {
    state.locale.set('de');

    expect(service.localize(path)).toBe(localized);
  });

  it.each(['/people', '/settings', '/privacy', '/terms', 'march/3', '../about'])(
    'leaves the private, legal, or relative path %s unchanged',
    (path: string) => {
      state.locale.set('de');

      expect(service.localize(path)).toBe(path);
    },
  );

  it('follows a language change', () => {
    state.locale.set('fr');
    const french: string = service.localize('/about');

    state.locale.set('uk');

    expect(french).toBe('/fr/about');
    expect(service.localize('/about')).toBe('/uk/about');
  });
});
