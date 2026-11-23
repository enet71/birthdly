import { inject, Injectable } from '@angular/core';
import { StateController } from '@birthday/web-shared-data-access';
import { AdminFeedbackState } from './admin-feedback.state';

@Injectable()
export class AdminFeedbackController extends StateController {
  private readonly adminFeedbackState: AdminFeedbackState = inject(AdminFeedbackState);

  // Also retries a failed load. A refresh still loading, a non-admin and a signed-out visitor need none.
  public refresh(): void {
    if (!this.adminFeedbackState.isRefreshing() && !this.adminFeedbackState.isNotFound()) {
      this.adminFeedbackState.feedbackResource.reload();
    }
  }
}
