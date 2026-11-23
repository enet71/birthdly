import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { FeedbackType } from '@birthday/shared-models';
import { FeedbackApiService } from '@birthday/web-feedback-data-access';
import { injectState, ReadonlyState, StateController } from '@birthday/web-shared-data-access';
import { AppTranslateService, LocaleState } from '@birthday/web-shared-i18n';
import { NotificationsService } from '@birthday/web-shared-util';
import { FeedbackFormModel } from '../types';
import { FeedbackState } from './feedback.state';

@Injectable()
export class FeedbackController extends StateController {
  private readonly feedbackState: FeedbackState = inject(FeedbackState);
  private readonly localeState: ReadonlyState<LocaleState> = injectState(LocaleState);
  private readonly feedbackApi: FeedbackApiService = inject(FeedbackApiService);
  private readonly notifications: NotificationsService = inject(NotificationsService);
  private readonly translator: AppTranslateService = inject(AppTranslateService);

  // The form validates the type before calling this. A filled honeypot is sent as is: the API drops it and answers
  // like for a real message. A failed send keeps the form as it was, so the sender can try again.
  public submit({ type, message, email, website }: FeedbackFormModel): void {
    if (this.feedbackState.isSending()) {
      return;
    }

    this.feedbackState.isSending.set(true);
    this.feedbackApi
      .send({
        type: type as FeedbackType,
        message: message.trim(),
        email: email.trim() || null,
        locale: this.localeState.locale(),
        ...(website && { website }),
      })
      .pipe(
        tap(() => this.feedbackState.isSent.set(true)),
        catchError((error: unknown) => {
          this.notifications.createErrorNotification(this.translator.translate(getErrorKey(error)));
          return EMPTY;
        }),
        finalize(() => this.feedbackState.isSending.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  public sendAnother(): void {
    this.feedbackState.isSent.set(false);
  }
}

function getErrorKey(error: unknown): string {
  return error instanceof HttpErrorResponse && error.status === HttpStatusCode.TooManyRequests
    ? 'notifications.feedback.tooMany'
    : 'notifications.feedback.failed';
}
