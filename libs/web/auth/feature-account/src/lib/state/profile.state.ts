import { computed, Injectable, ResourceRef, signal, Signal, WritableSignal } from '@angular/core';
import { differenceInCalendarDays, parseISO, startOfToday } from 'date-fns';
import { AuthState } from '@birthday/web-auth-data-access';
import { getNextBirthday, hasBirthYear } from '@birthday/web-birthdays-util';
import { GoogleCalendarState } from '@birthday/web-google-calendar-data-access';
import { DevicePushSubscription, PushSupport, RemindersState } from '@birthday/web-reminders-data-access';
import { injectState, ReadonlyState, State } from '@birthday/web-shared-data-access';
import { ProfileBirthday, ProfileGoogleCalendarStatus, ProfileRemindersStatus } from '../types';

// Provided by the profile route.
@Injectable()
export class ProfileState extends State {
  private readonly authState: ReadonlyState<AuthState> = injectState(AuthState);
  private readonly googleCalendarState: ReadonlyState<GoogleCalendarState> = injectState(GoogleCalendarState);
  private readonly remindersState: ReadonlyState<RemindersState> = injectState(RemindersState);
  private readonly today: Date = startOfToday();

  public readonly isSaving: WritableSignal<boolean> = signal(false);
  public readonly birthDate: Signal<string | null> = computed(() => this.authState.user()?.birthDate ?? null);
  public readonly birthday: Signal<ProfileBirthday | null> = computed(() => this.toProfileBirthday(this.birthDate()));
  public readonly memberSince: Signal<Date | null> = computed(() => this.toMemberSince(this.authState.user()?.createdAt));
  public readonly googleCalendarStatus: Signal<ProfileGoogleCalendarStatus> = computed(() => this.findGoogleCalendarStatus());
  public readonly remindersStatus: Signal<ProfileRemindersStatus> = computed(() => this.findRemindersStatus());

  public override resetState(): void {
    this.isSaving.set(false);
  }

  private toProfileBirthday(birthDate: string | null): ProfileBirthday | null {
    if (!birthDate) {
      return null;
    }

    return {
      date: parseISO(birthDate),
      hasYear: hasBirthYear(birthDate),
      daysUntil: differenceInCalendarDays(getNextBirthday(birthDate, this.today), this.today),
    };
  }

  private toMemberSince(createdAt: string | undefined): Date | null {
    return createdAt ? parseISO(createdAt) : null;
  }

  private findGoogleCalendarStatus(): ProfileGoogleCalendarStatus {
    if (this.googleCalendarState.isLoading()) {
      return 'loading';
    }
    if (this.googleCalendarState.connectionResource.error()) {
      return 'failed';
    }

    return this.googleCalendarState.isConnected() ? 'connected' : 'notConnected';
  }

  // Notifications are turned on per browser, so the status is the one of this device. On iOS they work once the app is
  // installed, which Settings explains, so that counts as off.
  private findRemindersStatus(): ProfileRemindersStatus {
    const support: PushSupport = this.remindersState.support();
    const subscription: ResourceRef<DevicePushSubscription | null | undefined> = this.remindersState.deviceSubscriptionResource;

    if (support === 'unsupported') {
      return 'unsupported';
    }
    if (support === 'iosNotInstalled') {
      return 'off';
    }
    if (this.authState.status() === 'unknown' || (subscription.isLoading() && !subscription.hasValue())) {
      return 'loading';
    }
    if (subscription.error()) {
      return 'failed';
    }

    return this.remindersState.deviceSubscription() ? 'on' : 'off';
  }
}
