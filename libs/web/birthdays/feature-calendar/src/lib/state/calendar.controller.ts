import { effect, inject, Injectable, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, finalize } from 'rxjs';
import { addMonths, addYears, startOfMonth } from 'date-fns';
import { AuthController } from '@birthday/web-auth-data-access';
import { GoogleCalendarController, GoogleCalendarState } from '@birthday/web-google-calendar-data-access';
import { AppLayoutController } from '@birthday/web-layout-data-access';
import { injectState, ReadonlyState, StateController } from '@birthday/web-shared-data-access';
import { BirthdayDialogController, BirthdaysController } from '@birthday/web-birthdays-data-access';
import { Birthday } from '@birthday/web-birthdays-util';
import { CalendarView } from '../types';
import { CalendarState } from './calendar.state';

@Injectable()
export class CalendarController extends StateController {
  private readonly calendarState: CalendarState = inject(CalendarState);
  private readonly birthdaysController: BirthdaysController = inject(BirthdaysController);
  private readonly birthdayDialogController: BirthdayDialogController = inject(BirthdayDialogController);
  private readonly googleCalendarState: ReadonlyState<GoogleCalendarState> = injectState(GoogleCalendarState);
  private readonly googleCalendarController: GoogleCalendarController = inject(GoogleCalendarController);
  private readonly authController: AuthController = inject(AuthController);
  private readonly appLayoutController: AppLayoutController = inject(AppLayoutController);

  constructor() {
    super();
    this.birthdaysController.reloadBirthdays();
    this.appLayoutController.trackLoading(this.calendarState.isLoading, this.destroyRef);
    // Brings changes from Google once the connection is known; the server limits it to once a minute.
    effect(() => {
      if (this.googleCalendarState.isConnected()) {
        untracked(() => this.importFromGoogle());
      }
    });
  }

  public setView(view: CalendarView): void {
    this.calendarState.view.set(view);
  }

  public showPrevious(): void {
    this.shiftViewMonth(-1);
  }

  public showNext(): void {
    this.shiftViewMonth(1);
  }

  public showToday(): void {
    this.calendarState.viewMonth.set(startOfMonth(this.calendarState.today));
  }

  public openAddBirthdayDialog(date?: Date): void {
    this.birthdayDialogController.openAddBirthdayDialog(date);
  }

  public openEditBirthdayDialog(birthday: Birthday): void {
    this.birthdayDialogController.openEditBirthdayDialog(birthday);
  }

  public signInWithGoogle(): void {
    this.calendarState.isSigningIn.set(true);
    this.authController
      .signInWithGoogle()
      .pipe(
        finalize(() => this.calendarState.isSigningIn.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  // Call it while handling the click: it opens the Google popup.
  public connectGoogleCalendar(): void {
    this.calendarState.isConnectingGoogleCalendar.set(true);
    this.googleCalendarController
      .connect()
      .pipe(
        finalize(() => this.calendarState.isConnectingGoogleCalendar.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private importFromGoogle(): void {
    this.googleCalendarController
      .syncAutomatically()
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.birthdaysController.reloadBirthdaysWhenIdle());
  }

  private shiftViewMonth(step: number): void {
    const shift: (date: Date, amount: number) => Date = this.calendarState.view() === 'year' ? addYears : addMonths;

    this.calendarState.viewMonth.update((month: Date) => shift(month, step));
  }
}
