import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MAX_REMINDER_DAYS, MAX_REMINDERS, MINUTES_PER_DAY } from '@birthday/shared-models';
import { GoogleCalendarState } from '@birthday/web-google-calendar-data-access';
import { GoogleCalendarSectionState } from '@birthday/web-google-calendar-feature-sync';
import { RemindersApiService, RemindersState } from '@birthday/web-reminders-data-access';
import { injectState, State } from '@birthday/web-shared-data-access';
import { PlatformService } from '@birthday/web-shared-util';
import { BrowserReminderChannelView, ReminderScheduleDraft } from '../types';

@Injectable()
export class ReminderScheduleState extends State {
  private readonly api = inject(RemindersApiService);
  private readonly google = injectState(GoogleCalendarState);
  private readonly googleSection = injectState(GoogleCalendarSectionState);
  private readonly browser = injectState(RemindersState);
  private readonly platform = inject(PlatformService);

  public readonly resource = rxResource({ stream: () => this.api.getSchedule() });
  public readonly reminders = computed(() => (this.resource.hasValue() ? this.resource.value().reminders : []));
  public readonly draft = signal<ReminderScheduleDraft | null>(null);
  public readonly saving = signal(false);
  public readonly browserPending = signal(false);
  public readonly channelPending = computed(() => this.browserPending() || this.googleSection.isPending());
  public readonly googleConnected = this.google.isConnected;
  public readonly googleView = this.googleSection.view;
  public readonly browserView: Signal<BrowserReminderChannelView> = computed(() => this.getBrowserView());
  public readonly browserConnected = computed(() => this.browserView() === 'enabled');
  // Closing while a request runs would drop its result, so the dialog stays open until it ends.
  public readonly canClose = computed(() => !this.saving() && !this.channelPending());
  public readonly canChangeSchedule = computed(() => !this.resource.isLoading() && !this.saving() && !this.channelPending());
  public readonly canAdd = computed(() => this.reminders().length < MAX_REMINDERS && !this.draft() && this.canChangeSchedule());
  public readonly duplicate = computed(() => this.hasDuplicate());
  public readonly valid = computed(() => this.isValid());

  private getBrowserView(): BrowserReminderChannelView {
    if (!this.platform.isRendered() || this.browser.isFirstLoad()) {
      return 'loading';
    }
    if (this.browser.hasLoadError()) {
      return 'error';
    }

    const support = this.browser.support();

    if (support !== 'supported') {
      return support;
    }
    if (this.browser.deviceSubscription()) {
      return 'enabled';
    }

    return this.browser.permission() === 'denied' ? 'blocked' : 'disabled';
  }

  private hasDuplicate(): boolean {
    const draft = this.draft();
    return Boolean(
      draft &&
        this.reminders().some(
          (other, index) => index !== draft.index && other.daysBefore === draft.row.daysBefore && other.minuteOfDay === draft.row.minuteOfDay,
        ),
    );
  }

  private isValid(): boolean {
    const row = this.draft()?.row;
    return Boolean(
      row &&
        Number.isInteger(row.daysBefore) &&
        row.daysBefore >= 0 &&
        row.daysBefore <= MAX_REMINDER_DAYS &&
        Number.isInteger(row.minuteOfDay) &&
        row.minuteOfDay >= 0 &&
        row.minuteOfDay < MINUTES_PER_DAY &&
        row.channels.length &&
        !this.duplicate(),
    );
  }
}
