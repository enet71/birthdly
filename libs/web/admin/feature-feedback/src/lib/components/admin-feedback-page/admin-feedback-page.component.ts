import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { FEEDBACK_ADMIN_LIST_LIMIT, FeedbackDto, FeedbackType } from '@birthday/shared-models';
import { injectState, ReadonlyState } from '@birthday/web-shared-data-access';
import { ADMIN_FEEDBACK_DATE_FORMAT, ADMIN_FEEDBACK_TYPE_LABELS } from '../../constants';
import { AdminFeedbackController, AdminFeedbackState } from '../../state';

@Component({
  selector: 'ui-admin-feedback-page',
  imports: [DatePipe, MatButton, MatIcon, MatProgressSpinner],
  templateUrl: './admin-feedback-page.component.html',
  styleUrl: './admin-feedback-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminFeedbackPageComponent {
  private readonly adminFeedbackState: ReadonlyState<AdminFeedbackState> = injectState(AdminFeedbackState);
  private readonly adminFeedbackController: AdminFeedbackController = inject(AdminFeedbackController);

  protected readonly typeLabels: Record<FeedbackType, string> = ADMIN_FEEDBACK_TYPE_LABELS;
  protected readonly dateFormat: string = ADMIN_FEEDBACK_DATE_FORMAT;
  protected readonly listLimit: number = FEEDBACK_ADMIN_LIST_LIMIT;

  protected get feedback(): Signal<FeedbackDto[] | null> {
    return this.adminFeedbackState.feedback;
  }

  protected get isLoading(): Signal<boolean> {
    return this.adminFeedbackState.isLoading;
  }

  protected get isRefreshing(): Signal<boolean> {
    return this.adminFeedbackState.isRefreshing;
  }

  protected get isNotFound(): Signal<boolean> {
    return this.adminFeedbackState.isNotFound;
  }

  protected get hasLoadError(): Signal<boolean> {
    return this.adminFeedbackState.hasLoadError;
  }

  protected refresh(): void {
    this.adminFeedbackController.refresh();
  }
}
