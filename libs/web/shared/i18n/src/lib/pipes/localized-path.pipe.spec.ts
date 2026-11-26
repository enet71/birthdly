import type { Mock } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LocalizedPathService } from '../services/localized-path.service';
import { LocalizedPathPipe } from './localized-path.pipe';

describe('LocalizedPathPipe', () => {
  const localizedPathService: { localize: Mock<LocalizedPathService['localize']> } = { localize: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [{ provide: LocalizedPathService, useValue: localizedPathService }],
    });
  });

  it('returns the path in the current language', () => {
    localizedPathService.localize.mockReturnValue('/de/about');
    const pipe: LocalizedPathPipe = TestBed.runInInjectionContext(() => new LocalizedPathPipe());

    expect(pipe.transform('/about')).toBe('/de/about');
    expect(localizedPathService.localize).toHaveBeenCalledWith('/about');
  });
});
