import { effect, inject, Injectable, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialogRef } from '@angular/material/dialog';
import { finalize, Observable } from 'rxjs';
import { ReminderChannel, ScheduledReminder } from '@birthday/shared-models';
import { GoogleCalendarSectionController } from '@birthday/web-google-calendar-feature-sync';
import { RemindersController } from '@birthday/web-reminders-data-access';
import { StateController } from '@birthday/web-shared-data-access';
import { ReminderScheduleState } from './reminder-schedule.state';

@Injectable()
export class ReminderScheduleController extends StateController {
  private readonly state = inject(ReminderScheduleState);
  private readonly google = inject(GoogleCalendarSectionController);
  private readonly browser = inject(RemindersController);
  private readonly dialogRef = inject(MatDialogRef);

  constructor() {
    super();
    this.browser.reload();
    // Escape and the backdrop respect `disableClose`; the close button is disabled from the same signal.
    effect(() => {
      this.dialogRef.disableClose = !this.state.canClose();
    });

    let googleWasConnected = this.state.googleConnected();
    effect(() => {
      const googleConnected = this.state.googleConnected();
      if (googleConnected !== googleWasConnected) {
        googleWasConnected = googleConnected;
        untracked(() => this.reloadWithoutDraft());
      }
    });
  }

  public edit(index: number | null): void {
    if (!this.state.canChangeSchedule() || this.state.draft()) {
      return;
    }

    const row = index === null ? { daysBefore: 1, minuteOfDay: 540, channels: [], enabled: true } : this.state.reminders()[index];
    this.state.draft.set({ index, row });
  }

  public changeDays(value: number): void {
    this.updateRow({ daysBefore: value });
  }

  public changeTime(value: string): void {
    const [hour, minute] = value.split(':').map(Number);
    this.updateRow({ minuteOfDay: hour * 60 + minute });
  }

  public changeChannels(channels: ReminderChannel[]): void {
    this.updateRow({ channels });
  }

  public cancel(): void {
    this.state.draft.set(null);
  }

  public connectGoogle(): void {
    if (!this.state.channelPending()) {
      this.google.connect();
    }
  }

  public disconnectGoogle(): void {
    if (!this.state.channelPending()) {
      this.google.openDisconnectDialog();
    }
  }

  public reloadGoogle(): void {
    this.google.reloadConnection();
  }

  public enableBrowser(): void {
    this.updateBrowserConnection(this.browser.enableOnDevice());
  }

  public disableBrowser(): void {
    this.updateBrowserConnection(this.browser.disableOnDevice());
  }

  public reloadBrowser(): void {
    this.browser.reload();
  }

  public reload(): void {
    this.state.resource.reload();
  }

  public save(): void {
    const draft = this.state.draft();
    if (!draft || !this.state.valid()) {
      return;
    }

    const rows = [...this.state.reminders()];

    if (draft.index === null) {
      rows.push(draft.row);
    } else {
      rows[draft.index] = draft.row;
    }
    this.persist(rows);
  }

  public remove(): void {
    const index = this.state.draft()?.index;
    if (index == null) {
      return;
    }
    this.persist(this.state.reminders().filter((_, rowIndex) => index !== rowIndex));
  }

  public toggle(index: number): void {
    this.persist(this.state.reminders().map((row, rowIndex) => (rowIndex === index ? { ...row, enabled: !row.enabled } : row)));
  }

  // A reload would replace the rows under an open editor, so it waits until the editor closes.
  private reloadWithoutDraft(): void {
    if (!this.state.draft()) {
      this.reload();
    }
  }

  private updateRow(changes: Partial<ScheduledReminder>): void {
    this.state.draft.update((draft) => draft && { ...draft, row: { ...draft.row, ...changes } });
  }

  private updateBrowserConnection(request: Observable<void>): void {
    if (this.state.channelPending()) {
      return;
    }
    this.state.browserPending.set(true);
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.state.browserPending.set(false)),
      )
      .subscribe(() => this.reloadWithoutDraft());
  }

  private persist(reminders: ScheduledReminder[]): void {
    if (!this.state.canChangeSchedule()) {
      return;
    }
    this.state.saving.set(true);
    this.browser
      .saveSchedule({ reminders })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.state.saving.set(false)),
      )
      .subscribe((schedule) => {
        this.state.resource.set(schedule);
        this.cancel();
      });
  }
}
