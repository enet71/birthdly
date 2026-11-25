import { effect, inject, Injectable, RESPONSE_INIT } from '@angular/core';
import { AppLayoutController } from '@birthday/web-layout-data-access';
import { StateController } from '@birthday/web-shared-data-access';
import { RoadmapState } from './roadmap.state';

@Injectable()
export class RoadmapController extends StateController {
  private readonly roadmapState: RoadmapState = inject(RoadmapState);
  // Only on the server.
  private readonly responseInit: ResponseInit | null = inject(RESPONSE_INIT, { optional: true });

  constructor() {
    super();
    inject(AppLayoutController).trackLoading(this.roadmapState.isLoading, this.destroyRef);
    // The page shows the error with a retry button. On the server it answers 503, so search engines come back later
    // instead of indexing the error.
    effect(() => {
      if (this.roadmapState.hasLoadError() && this.responseInit) {
        this.responseInit.status = 503;
      }
    });
  }

  public retry(): void {
    this.roadmapState.itemsResource.reload();
  }
}
