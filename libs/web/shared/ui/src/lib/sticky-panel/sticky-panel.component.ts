import { ChangeDetectionStrategy, Component } from '@angular/core';

// A glass panel that stays under the top bar while the page content scrolls, for a page toolbar and its filters.
@Component({
  selector: 'ui-sticky-panel',
  templateUrl: './sticky-panel.component.html',
  styleUrl: './sticky-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StickyPanelComponent {}
