import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { RoadmapItemStatus } from '@birthday/shared-models';
import { injectState, ReadonlyState } from '@birthday/web-shared-data-access';
import { LocaleDatePipe } from '@birthday/web-shared-i18n';
import { TranslocoPipe } from '@jsverse/transloco';
import { ROADMAP_RELEASE_DATE_FORMAT, ROADMAP_STATUS_ICONS } from '../../constants';
import { RoadmapController, RoadmapState } from '../../state';
import { RoadmapSection } from '../../types';

@Component({
  selector: 'ui-roadmap-page',
  imports: [TranslocoPipe, LocaleDatePipe, RouterLink, MatButton, MatIcon, MatProgressSpinner],
  templateUrl: './roadmap-page.component.html',
  styleUrl: './roadmap-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoadmapPageComponent {
  private readonly roadmapState: ReadonlyState<RoadmapState> = injectState(RoadmapState);
  private readonly roadmapController: RoadmapController = inject(RoadmapController);

  protected readonly statusIcons: Record<RoadmapItemStatus, string> = ROADMAP_STATUS_ICONS;
  protected readonly releaseDateFormat: string = ROADMAP_RELEASE_DATE_FORMAT;

  protected get sections(): Signal<RoadmapSection[]> {
    return this.roadmapState.sections;
  }

  protected get isLoading(): Signal<boolean> {
    return this.roadmapState.isLoading;
  }

  protected get isFirstLoad(): Signal<boolean> {
    return this.roadmapState.isFirstLoad;
  }

  protected get hasLoadError(): Signal<boolean> {
    return this.roadmapState.hasLoadError;
  }

  protected retry(): void {
    this.roadmapController.retry();
  }
}
