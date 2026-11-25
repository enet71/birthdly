import { effect, inject, Injectable, untracked } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, concatMap, defer, EMPTY, filter, from, map, Observable, of, switchMap, take, tap, toArray } from 'rxjs';
import { BirthdayDto, CreateBirthdayRequest } from '@birthday/shared-models';
import { AuthState } from '@birthday/web-auth-data-access';
import { injectState, ReadonlyState, StateController } from '@birthday/web-shared-data-access';
import { AnalyticsService, NotificationsService } from '@birthday/web-shared-util';
import {
  Birthday,
  BIRTHDAY_PHOTO_SOURCE_MAX_MB,
  PhotoTooLargeError,
  toBirthDate,
  toBirthdayPhoto,
  WebpNotSupportedError,
} from '@birthday/web-birthdays-util';
import { BirthdaysDataService, BirthdaysApiService, BirthdaysLocalStorageService } from '../services';
import { BirthdayInput } from '../types';
import { BirthdaysState } from './birthdays.state';
import { AppTranslateService } from '@birthday/web-shared-i18n';

@Injectable({ providedIn: 'root' })
export class BirthdaysController extends StateController {
  private readonly birthdaysState: BirthdaysState = inject(BirthdaysState);
  private readonly authState: ReadonlyState<AuthState> = injectState(AuthState);
  private readonly birthdaysData: BirthdaysDataService = inject(BirthdaysDataService);
  private readonly localStorage: BirthdaysLocalStorageService = inject(BirthdaysLocalStorageService);
  private readonly birthdaysApi: BirthdaysApiService = inject(BirthdaysApiService);
  private readonly notifications: NotificationsService = inject(NotificationsService);
  private readonly translator: AppTranslateService = inject(AppTranslateService);
  private readonly analytics: AnalyticsService = inject(AnalyticsService);
  private readonly isListLoading$: Observable<boolean> = toObservable(this.birthdaysState.birthdaysResource.isLoading);

  constructor() {
    super();
    effect(() => {
      if (this.birthdaysState.birthdaysResource.error()) {
        // Untracked, so a language switch does not show the error again.
        untracked(() => this.notifications.createErrorNotification(this.translator.translate('notifications.birthdays.loadFailed')));
      }
    });
    effect(() => {
      if (this.authState.isAuthenticated()) {
        untracked(() => this.importLocalBirthdays());
      }
    });
  }

  // Reloads on every entry to the calendar, which also retries a failed load.
  public reloadBirthdays(): void {
    this.birthdaysState.birthdaysResource.reload();
  }

  // For changes made outside this app, for example an import from Google. `reload()` is ignored while a load is in
  // flight, and that load may have read the list before the change, so this waits for it to finish first.
  public reloadBirthdaysWhenIdle(): void {
    this.isListLoading$
      .pipe(
        filter((isLoading: boolean) => !isLoading),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.birthdaysState.birthdaysResource.reload());
  }

  // The methods below complete without emitting when the change could not be saved.
  public addBirthday(input: BirthdayInput): Observable<Birthday> {
    return this.birthdaysData.create(this.toRequest(input)).pipe(
      tap((birthday: Birthday) => {
        this.updateBirthdays((birthdays: Birthday[]) => [...birthdays, birthday]);
        this.analytics.track('birthday_added', { signed_in: this.authState.isAuthenticated() });
      }),
      catchError(() => {
        this.notifications.createErrorNotification(this.translator.translate('notifications.birthdays.saveFailed'));
        return EMPTY;
      }),
    );
  }

  public updateBirthday(id: string, input: BirthdayInput): Observable<Birthday> {
    return this.birthdaysData.update(id, this.toRequest(input)).pipe(
      tap((updated: Birthday) => this.replaceBirthday(updated)),
      catchError(() => {
        this.notifications.createErrorNotification(this.translator.translate('notifications.birthdays.saveFailed'));
        return EMPTY;
      }),
    );
  }

  public deleteBirthday(id: string): Observable<void> {
    // A `DELETE` response may complete without emitting a value.
    return this.birthdaysData.delete(id).pipe(
      tap({
        complete: () => {
          this.updateBirthdays((birthdays: Birthday[]) => birthdays.filter((birthday: Birthday) => birthday.id !== id));
          this.analytics.track('birthday_deleted');
        },
      }),
      catchError(() => {
        this.notifications.createErrorNotification(this.translator.translate('notifications.birthdays.deleteFailed'));
        return EMPTY;
      }),
    );
  }

  // Cuts and compresses the image in the browser before uploading it; the old photo stays when anything fails.
  public setPhoto(id: string, image: Blob): Observable<Birthday> {
    return defer(() => toBirthdayPhoto(image)).pipe(
      catchError((error: unknown) => {
        this.notifications.createErrorNotification(this.getPhotoErrorMessage(error));
        return EMPTY;
      }),
      switchMap((photo: Blob) =>
        this.birthdaysApi.setPhoto(id, photo).pipe(
          catchError(() => {
            this.notifications.createErrorNotification(this.translator.translate('notifications.birthdays.photoSaveFailed'));
            return EMPTY;
          }),
        ),
      ),
      tap((updated: Birthday) => this.replaceBirthday(updated)),
    );
  }

  public removePhoto(id: string): Observable<Birthday> {
    return this.birthdaysApi.removePhoto(id).pipe(
      tap((updated: Birthday) => this.replaceBirthday(updated)),
      catchError(() => {
        this.notifications.createErrorNotification(this.translator.translate('notifications.birthdays.photoRemoveFailed'));
        return EMPTY;
      }),
    );
  }

  // Moves the birthdays a user added while signed out into their account. Each one leaves local storage only after it
  // is saved, and a failed one does not stop the rest, so the failed ones stay local for the next sign-in.
  private importLocalBirthdays(): void {
    this.localStorage
      .getAll()
      .pipe(
        filter((birthdays: BirthdayDto[]) => birthdays.length > 0),
        switchMap((birthdays: BirthdayDto[]) =>
          from(birthdays).pipe(
            concatMap(({ id, name, birthDate, relationship, notes }: BirthdayDto) =>
              this.birthdaysApi.create({ name, birthDate, relationship, notes }).pipe(
                concatMap(() => this.localStorage.delete(id)),
                map(() => true),
                catchError(() => of(false)),
              ),
            ),
            toArray(),
          ),
        ),
        tap((results: boolean[]) => {
          const failedCount: number = results.filter((isMoved: boolean) => !isMoved).length;

          if (failedCount > 0) {
            this.notifications.createErrorNotification(this.translator.translatePlural('notifications.birthdays.moveFailed', failedCount));
          }
        }),
        // `reload()` is ignored while a load is in flight, so wait for the current load of the account list first.
        switchMap(() =>
          this.isListLoading$.pipe(
            filter((isLoading: boolean) => !isLoading),
            take(1),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.birthdaysState.birthdaysResource.reload());
  }

  private toRequest({ name, date, isYearKnown, relationship, notes }: BirthdayInput): CreateBirthdayRequest {
    const trimmedNotes: string = notes.trim();

    return { name: name.trim(), birthDate: toBirthDate(date, isYearKnown), relationship, notes: trimmedNotes || null };
  }

  private getPhotoErrorMessage(error: unknown): string {
    if (error instanceof PhotoTooLargeError) {
      return this.translator.translate('notifications.birthdays.photoTooLarge', { maxMb: BIRTHDAY_PHOTO_SOURCE_MAX_MB });
    }
    return this.translator.translate(
      error instanceof WebpNotSupportedError ? 'notifications.birthdays.photoNotSupported' : 'notifications.birthdays.photoUnreadable',
    );
  }

  private replaceBirthday(updated: Birthday): void {
    this.updateBirthdays((birthdays: Birthday[]) => birthdays.map((birthday: Birthday) => (birthday.id === updated.id ? updated : birthday)));
  }

  // Writes through `birthdays()` so a failed load is updated from an empty list.
  private updateBirthdays(updater: (birthdays: Birthday[]) => Birthday[]): void {
    const isLoading: boolean = this.birthdaysState.isLoading();

    this.birthdaysState.birthdaysResource.set(updater(this.birthdaysState.birthdays()));
    // `set()` aborts an in-flight load, so load the list again with the saved change.
    if (isLoading) {
      this.birthdaysState.birthdaysResource.reload();
    }
  }
}
