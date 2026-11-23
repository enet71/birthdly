import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Signal,
  signal,
  untracked,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { FieldTree, form, FormField, maxLength, pattern, required, submit, validate } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatHint, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import {
  FEEDBACK_EMAIL_MAX_LENGTH,
  FEEDBACK_EMAIL_PATTERN,
  FEEDBACK_MESSAGE_MAX_LENGTH,
  FEEDBACK_TYPES,
  FeedbackType,
} from '@birthday/shared-models';
import { injectState, ReadonlyState } from '@birthday/web-shared-data-access';
import { TranslocoPipe } from '@jsverse/transloco';
import { FEEDBACK_TYPE_ICONS } from '../../constants';
import { FeedbackController, FeedbackState } from '../../state';
import { FeedbackFormModel } from '../../types';

@Component({
  selector: 'ui-feedback-page',
  imports: [TranslocoPipe, FormField, MatButton, MatError, MatFormField, MatHint, MatIcon, MatInput, MatLabel, MatOption, MatPrefix, MatSelect],
  templateUrl: './feedback-page.component.html',
  styleUrl: './feedback-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackPageComponent {
  private readonly feedbackState: ReadonlyState<FeedbackState> = injectState(FeedbackState);
  private readonly feedbackController: FeedbackController = inject(FeedbackController);

  protected readonly types: readonly FeedbackType[] = FEEDBACK_TYPES;
  protected readonly typeIcons: Record<FeedbackType, string> = FEEDBACK_TYPE_ICONS;
  protected readonly messageMaxLength: number = FEEDBACK_MESSAGE_MAX_LENGTH;
  protected readonly model: WritableSignal<FeedbackFormModel> = signal(this.createModel());
  // Counts characters like the API does, so an emoji counts once.
  protected readonly messageLength: Signal<number> = computed(() => countCharacters(this.model().message.trim()));
  // Error messages are translation keys; the template translates them. The rules match the API.
  protected readonly feedbackForm: FieldTree<FeedbackFormModel> = form(this.model, (path) => {
    required(path.type, { message: 'feedback.errors.typeRequired' });
    required(path.message, { message: 'feedback.errors.messageRequired' });
    pattern(path.message, /\S/, { message: 'feedback.errors.messageRequired' });
    validate(path.message, ({ value }) =>
      countCharacters(value().trim()) > FEEDBACK_MESSAGE_MAX_LENGTH ? { kind: 'tooLong', message: 'feedback.errors.messageTooLong' } : undefined,
    );
    pattern(path.email, FEEDBACK_EMAIL_PATTERN, { message: 'feedback.errors.emailInvalid' });
    maxLength(path.email, FEEDBACK_EMAIL_MAX_LENGTH, { message: 'feedback.errors.emailInvalid' });
  });

  // Each view has its own card title; a new one replaces the element that had focus.
  private readonly cardTitle: Signal<ElementRef<HTMLElement> | undefined> = viewChild<ElementRef<HTMLElement>>('cardTitle');
  private hasShownFirstView = false;

  constructor() {
    // The account loads after the page on a fresh visit; its address fills the field unless the sender already typed one.
    effect(() => {
      const accountEmail: string = this.feedbackState.accountEmail();

      untracked(() => {
        if (accountEmail && !this.feedbackForm.email().dirty()) {
          this.feedbackForm.email().value.set(accountEmail);
        }
      });
    });
    // Sending or sending again swaps the card and removes the focused button, so focus moves to the new card's title,
    // which screen readers then read. The first view keeps the browser's own focus.
    effect(() => {
      const title: ElementRef<HTMLElement> | undefined = this.cardTitle();

      untracked(() => {
        if (title && this.hasShownFirstView) {
          title.nativeElement.focus();
        }
        this.hasShownFirstView ||= !!title;
      });
    });
  }

  protected get isSending(): Signal<boolean> {
    return this.feedbackState.isSending;
  }

  protected get isSent(): Signal<boolean> {
    return this.feedbackState.isSent;
  }

  protected send(event: Event): void {
    event.preventDefault();
    // `submit` requires a Promise-returning action; sending itself stays an Observable in the controller.
    submit(this.feedbackForm, async () => this.feedbackController.submit(this.model()));
  }

  protected sendAnother(): void {
    this.feedbackForm().reset(this.createModel());
    this.feedbackController.sendAnother();
  }

  private createModel(): FeedbackFormModel {
    return { type: null, message: '', email: this.feedbackState.accountEmail(), website: '' };
  }
}

function countCharacters(value: string): number {
  return [...value].length;
}
