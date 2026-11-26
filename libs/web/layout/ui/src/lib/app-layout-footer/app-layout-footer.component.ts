import { ChangeDetectionStrategy, Component, computed, inject, input, InputSignal, Signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_LAYOUT_CONFIG, AppLayoutConfig, AppLayoutLink } from '@birthday/web-layout-util';
import { TranslocoPipe } from '@jsverse/transloco';
import { LocalizedPathPipe } from '@birthday/web-shared-i18n';

@Component({
  selector: 'ui-app-layout-footer',
  imports: [TranslocoPipe, RouterLink, LocalizedPathPipe],
  templateUrl: './app-layout-footer.component.html',
  styleUrl: './app-layout-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.compact]': 'compact()',
  },
})
export class AppLayoutFooterComponent {
  protected readonly config: AppLayoutConfig = inject(APP_LAYOUT_CONFIG);
  protected readonly year: number = new Date().getFullYear();
  // In the sidenav: a copyright line instead of the tagline, and no links that its secondary menu already shows.
  readonly compact: InputSignal<boolean> = input(false);

  protected readonly links: Signal<AppLayoutLink[]> = computed(() => {
    const links: AppLayoutLink[] = this.config.footer?.links ?? [];

    if (!this.compact()) {
      return links;
    }

    const menuPaths: Set<string> = new Set((this.config.secondaryMenu ?? []).map(({ path }) => path));

    return links.filter(({ path }) => !menuPaths.has(path));
  });
}
