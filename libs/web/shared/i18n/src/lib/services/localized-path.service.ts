import { inject, Injectable } from '@angular/core';
import { injectState, ReadonlyState } from '@birthday/web-shared-data-access';
import { isLocalizedPath, localizePath } from '../helpers';
import { LocaleState } from '../state/locale.state';
import { I18N_OPTIONS } from '../tokens';

// Builds links in the current language: `/about` → `/de/about` in German, while `/people`, which has one URL for every language,
// stays as it is. It reads `LocaleState`, so a template, `computed`, or `effect` that calls it updates after a language switch.
@Injectable({ providedIn: 'root' })
export class LocalizedPathService {
  private readonly localeState: ReadonlyState<LocaleState> = injectState(LocaleState);
  private readonly localizedPaths: ReadonlySet<string> = new Set(inject(I18N_OPTIONS).localizedPaths);

  public localize(path: string): string {
    return isLocalizedPath(path, this.localizedPaths) ? localizePath(path, this.localeState.locale()) : path;
  }
}
