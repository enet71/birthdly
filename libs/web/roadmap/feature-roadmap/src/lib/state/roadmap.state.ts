import { computed, inject, Injectable, linkedSignal, ResourceRef, Signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AppLocale, RoadmapItemDto, RoadmapResponse } from '@birthday/shared-models';
import { injectState, ReadonlyState, State } from '@birthday/web-shared-data-access';
import { LocaleState } from '@birthday/web-shared-i18n';
import { RoadmapApiService } from '@birthday/web-roadmap-data-access';
import { buildRoadmapSections } from '../helpers';
import { RoadmapSection } from '../types';

@Injectable()
export class RoadmapState extends State {
  private readonly localeState: ReadonlyState<LocaleState> = injectState(LocaleState);
  private readonly roadmapApi: RoadmapApiService = inject(RoadmapApiService);
  private readonly today: Date = new Date();

  // The texts come in the current language, so a new language loads the items again.
  public readonly itemsResource: ResourceRef<RoadmapResponse | undefined> = rxResource({
    params: () => this.localeState.locale(),
    stream: ({ params: locale }: { params: AppLocale }) => this.roadmapApi.getItems({ locale }),
  });
  // Keeps the shown items while another language loads, so the page does not collapse into a spinner.
  public readonly items: Signal<RoadmapItemDto[]> = linkedSignal<RoadmapResponse | undefined, RoadmapItemDto[]>({
    source: () => (this.itemsResource.hasValue() ? this.itemsResource.value() : undefined),
    computation: (response: RoadmapResponse | undefined, previous?: { value: RoadmapItemDto[] }) => response?.items ?? previous?.value ?? [],
  });
  // A status without items has no section; released items are grouped by month.
  public readonly sections: Signal<RoadmapSection[]> = computed(() => buildRoadmapSections(this.items(), this.today));
  public readonly isLoading: Signal<boolean> = computed(() => this.itemsResource.isLoading());
  public readonly hasLoadError: Signal<boolean> = computed(() => !!this.itemsResource.error());
  // Nothing to show yet: the first load is still running.
  public readonly isFirstLoad: Signal<boolean> = computed(() => this.isLoading() && !this.items().length);
}
