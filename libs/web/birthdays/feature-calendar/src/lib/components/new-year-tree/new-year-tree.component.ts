import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BrowserStorageService } from '@birthday/web-shared-util';
import { NEW_YEAR_TREE_SHOWN_KEY } from '../../constants';

@Component({
  selector: 'ui-new-year-tree',
  templateUrl: './new-year-tree.component.html',
  styleUrl: './new-year-tree.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.entering]': 'playsEntrance',
  },
})
export class NewYearTreeComponent {
  private readonly browserStorage: BrowserStorageService = inject(BrowserStorageService);

  // The entrance plays once per browser session; later visits show the tree already lit.
  protected readonly playsEntrance: boolean = this.claimEntrance();

  private claimEntrance(): boolean {
    try {
      const storage: Storage | null = this.browserStorage.sessionStorage;

      if (!storage || storage.getItem(NEW_YEAR_TREE_SHOWN_KEY)) {
        return false;
      }

      storage.setItem(NEW_YEAR_TREE_SHOWN_KEY, 'true');

      return true;
    } catch {
      // Storage can be blocked (for example, with site data disabled); skip the entrance rather than replay it each time.
      return false;
    }
  }
}
