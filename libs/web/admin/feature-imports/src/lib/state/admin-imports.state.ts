import { computed, inject, Injectable, linkedSignal, ResourceRef, Signal, WritableSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CelebrityImportsStatusResponse, CelebrityImportStatus, CelebritySegmentImportDto } from '@birthday/shared-models';
import { AdminApiService } from '@birthday/web-admin-data-access';
import { AuthState } from '@birthday/web-auth-data-access';
import { injectState, ReadonlyState, State } from '@birthday/web-shared-data-access';
import { PlatformService } from '@birthday/web-shared-util';
import { ADMIN_EXPANDED_IMPORT_STATUSES, ADMIN_IMPORT_STATUS_PRIORITY } from '../constants';
import { AdminImportStage, AdminSegmentGroup } from '../types';

@Injectable()
export class AdminImportsState extends State {
  private readonly authState: ReadonlyState<AuthState> = injectState(AuthState);
  private readonly adminApi: AdminApiService = inject(AdminApiService);
  private readonly platform: PlatformService = inject(PlatformService);

  // Loads in the browser only (the server does not know the user) and only for a signed-in user. `null` means the user
  // is not an admin.
  public readonly statusResource: ResourceRef<CelebrityImportsStatusResponse | null | undefined> = rxResource({
    params: () => (this.platform.isRendered() && this.authState.status() === 'signedIn' ? this.authState.user()?.id : undefined),
    stream: () => this.adminApi.getCelebrityImportsStatus(),
  });
  public readonly status: Signal<CelebrityImportsStatusResponse | null> = computed(() =>
    this.statusResource.hasValue() ? (this.statusResource.value() ?? null) : null,
  );
  // The server always sees a signed-out visitor, so it renders the spinner, not "Page not found", to keep admins from a
  // flash of it on every full load.
  public readonly isNotFound: Signal<boolean> = computed(
    () =>
      (this.platform.isRendered() && this.authState.status() === 'signedOut') ||
      (this.statusResource.hasValue() && this.statusResource.value() === null),
  );
  public readonly hasLoadError: Signal<boolean> = computed(() => !!this.statusResource.error());
  public readonly isLoading: Signal<boolean> = computed(() => !this.status() && !this.isNotFound() && !this.hasLoadError());
  public readonly isRefreshing: Signal<boolean> = computed(() => this.statusResource.isLoading());
  public readonly stages: Signal<AdminImportStage[]> = computed(() => this.buildStages(this.status()));
  public readonly segmentGroups: Signal<AdminSegmentGroup[]> = computed(() => this.buildSegmentGroups(this.status()?.segments ?? []));
  // Countries whose segments are shown. Picked once when the first status arrives, then changed only by the admin, so
  // the refresh every 10 seconds keeps it. `null` until then.
  public readonly expandedCountries: WritableSignal<ReadonlySet<string> | null> = linkedSignal({
    source: this.segmentGroups,
    computation: (groups: AdminSegmentGroup[], previous?: { value: ReadonlySet<string> | null }) =>
      previous?.value ?? this.pickInitiallyExpanded(groups),
  });
  // Something still waits, runs or will be retried.
  public readonly isImportRunning: Signal<boolean> = computed(
    () => !!this.status()?.queues.some(({ counts }) => counts.created + counts.active + counts.retry > 0),
  );

  private buildSegmentGroups(segments: CelebritySegmentImportDto[]): AdminSegmentGroup[] {
    const byCountry: Map<string, CelebritySegmentImportDto[]> = new Map();

    for (const segment of segments) {
      const country: string = segment.segment.split('-')[0];
      byCountry.set(country, [...(byCountry.get(country) ?? []), segment]);
    }

    return [...byCountry].map(([country, countrySegments]: [string, CelebritySegmentImportDto[]]) => toSegmentGroup(country, countrySegments));
  }

  private pickInitiallyExpanded(groups: AdminSegmentGroup[]): ReadonlySet<string> | null {
    if (!groups.length) {
      return null;
    }

    return new Set(
      groups.filter(({ status }: AdminSegmentGroup) => ADMIN_EXPANDED_IMPORT_STATUSES.has(status)).map(({ country }: AdminSegmentGroup) => country),
    );
  }

  private buildStages(status: CelebrityImportsStatusResponse | null): AdminImportStage[] {
    if (!status) {
      return [];
    }

    const { people, withDetails, withPageviews, withPhotosChecked, withPhotos } = status.progress;

    return [
      { label: 'Details (names, links, field)', done: withDetails, total: people, percent: toPercent(withDetails, people) },
      {
        label: 'Photos checked (Wikidata image, Commons license)',
        done: withPhotosChecked,
        total: people,
        percent: toPercent(withPhotosChecked, people),
      },
      { label: 'Photos shown, of those checked', done: withPhotos, total: withPhotosChecked, percent: toPercent(withPhotos, withPhotosChecked) },
      { label: 'Page views', done: withPageviews, total: people, percent: toPercent(withPageviews, people) },
    ];
  }
}

const countryNames: Intl.DisplayNames = new Intl.DisplayNames('en', { type: 'region' });

function toSegmentGroup(country: string, segments: CelebritySegmentImportDto[]): AdminSegmentGroup {
  const statuses: Set<CelebrityImportStatus> = new Set(segments.map(({ status }: CelebritySegmentImportDto) => status));
  const startedAt: string[] = segments.flatMap(({ startedAt }: CelebritySegmentImportDto) => (startedAt ? [startedAt] : [])).sort();
  const finishedAt: string[] = segments.flatMap(({ finishedAt }: CelebritySegmentImportDto) => (finishedAt ? [finishedAt] : [])).sort();
  const people: number[] = segments.flatMap(({ people }: CelebritySegmentImportDto) => (people === null ? [] : [people]));

  return {
    country,
    countryName: countryNames.of(country) ?? country,
    status: ADMIN_IMPORT_STATUS_PRIORITY.find((status: CelebrityImportStatus) => statuses.has(status)) ?? 'notImported',
    finished: segments.filter(({ status }: CelebritySegmentImportDto) => status === 'finished').length,
    startedAt: startedAt[0] ?? null,
    finishedAt: finishedAt.at(-1) ?? null,
    people: people.length ? people.reduce((sum: number, count: number) => sum + count, 0) : null,
    segments,
  };
}

function toPercent(done: number, total: number): number {
  return total ? Math.floor((done / total) * 100) : 0;
}
