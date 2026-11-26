import { inject, Pipe, PipeTransform } from '@angular/core';
import { LocalizedPathService } from '../services/localized-path.service';

// `[routerLink]="'/about' | localizedPath"`. Impure, because the link follows the current language.
@Pipe({ name: 'localizedPath', pure: false })
export class LocalizedPathPipe implements PipeTransform {
  private readonly localizedPathService: LocalizedPathService = inject(LocalizedPathService);

  public transform(path: string): string {
    return this.localizedPathService.localize(path);
  }
}
