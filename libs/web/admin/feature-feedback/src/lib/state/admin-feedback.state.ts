import { computed, inject, Injectable, ResourceRef, Signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FeedbackDto } from '@birthday/shared-models';
import { AdminApiService } from '@birthday/web-admin-data-access';
import { AuthState } from '@birthday/web-auth-data-access';
import { injectState, ReadonlyState, State } from '@birthday/web-shared-data-access';
import { PlatformService } from '@birthday/web-shared-util';

@Injectable()
export class AdminFeedbackState extends State {
  private readonly authState: ReadonlyState<AuthState> = injectState(AuthState);
  private readonly adminApi: AdminApiService = inject(AdminApiService);
  private readonly platform: PlatformService = inject(PlatformService);

  // Loads in the browser only (the server does not know the user) and only for a signed-in user. `null` means the user
  // is not an admin.
  public readonly feedbackResource: ResourceRef<FeedbackDto[] | null | undefined> = rxResource({
    params: () => (this.platform.isRendered() && this.authState.status() === 'signedIn' ? this.authState.user()?.id : undefined),
    stream: () => this.adminApi.getFeedback(),
  });
  public readonly feedback: Signal<FeedbackDto[] | null> = computed(() =>
    this.feedbackResource.hasValue() ? (this.feedbackResource.value() ?? null) : null,
  );
  // The server always sees a signed-out visitor, so it renders the spinner, not "Page not found", to keep admins from a
  // flash of it on every full load.
  public readonly isNotFound: Signal<boolean> = computed(
    () =>
      (this.platform.isRendered() && this.authState.status() === 'signedOut') ||
      (this.feedbackResource.hasValue() && this.feedbackResource.value() === null),
  );
  public readonly hasLoadError: Signal<boolean> = computed(() => !!this.feedbackResource.error());
  public readonly isLoading: Signal<boolean> = computed(() => !this.feedback() && !this.isNotFound() && !this.hasLoadError());
  public readonly isRefreshing: Signal<boolean> = computed(() => this.feedbackResource.isLoading());
}
