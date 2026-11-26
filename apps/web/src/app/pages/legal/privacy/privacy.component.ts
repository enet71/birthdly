import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocalizedPathPipe } from '@birthday/web-shared-i18n';

@Component({
  selector: 'app-privacy',
  imports: [RouterLink, LocalizedPathPipe],
  templateUrl: './privacy.component.html',
  styleUrl: '../legal-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The text is English in every language of the site.
  host: { lang: 'en' },
})
export class PrivacyComponent {}
