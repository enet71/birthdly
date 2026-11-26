import type { Mock } from 'vitest';
import { computed, signal, Signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DateAdapter } from '@angular/material/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { CelebrityDto } from '@birthday/shared-models';
import { AuthController, AuthState, AuthStatus } from '@birthday/web-auth-data-access';
import { BirthdayDialogController } from '@birthday/web-birthdays-data-access';
import { CelebritiesApiService } from '@birthday/web-celebrities-data-access';
import { AppLayoutController } from '@birthday/web-layout-data-access';
import { AppTranslateService, LocalizedPathService } from '@birthday/web-shared-i18n';
import { NotificationsService } from '@birthday/web-shared-util';
import { toCelebrityBirthdayDraft } from '../helpers';
import { BornDayController } from './born-day.controller';
import { BornDayState } from './born-day.state';

const CELEBRITY = {
  id: 'Q7259',
  name: 'Ada Lovelace',
  birthDate: '1815-12-10',
  countries: ['GB'],
  deathDate: '1852-11-27',
  wikipediaUrl: 'https://en.wikipedia.org/wiki/Ada_Lovelace',
  photo: null,
} as unknown as CelebrityDto;

describe('BornDayController', () => {
  let controller: BornDayController;
  let state: BornDayState;
  let authStatus: WritableSignal<AuthStatus>;
  let signIn: Subject<void>;
  const authController: { signInWithGoogle: Mock<AuthController['signInWithGoogle']> } = { signInWithGoogle: vi.fn() };
  const birthdayDialogController: { openAddBirthdayDialogWithDraft: Mock<BirthdayDialogController['openAddBirthdayDialogWithDraft']> } = {
    openAddBirthdayDialogWithDraft: vi.fn(),
  };

  // The sign-in finishes as signed in, or as still signed out when the user closed the popup.
  function finishSignIn(status: AuthStatus): void {
    authStatus.set(status);
    signIn.complete();
  }

  beforeEach(() => {
    vi.clearAllMocks();
    authStatus = signal<AuthStatus>('signedOut');
    signIn = new Subject<void>();
    authController.signInWithGoogle.mockReturnValue(signIn);
    const authState: { status: Signal<AuthStatus>; isAuthenticated: Signal<boolean> } = {
      status: authStatus,
      isAuthenticated: computed(() => authStatus() === 'signedIn'),
    };

    TestBed.configureTestingModule({
      providers: [
        BornDayState,
        BornDayController,
        { provide: AuthState, useValue: authState },
        { provide: AuthController, useValue: authController },
        { provide: BirthdayDialogController, useValue: birthdayDialogController },
        // Loading the people is not part of these tests.
        { provide: CelebritiesApiService, useValue: {} },
        { provide: Router, useValue: {} },
        { provide: DateAdapter, useValue: { setLocale: vi.fn() } },
        { provide: AppLayoutController, useValue: { trackLoading: vi.fn() } },
        { provide: NotificationsService, useValue: { createErrorNotification: vi.fn() } },
        { provide: AppTranslateService, useValue: { translate: (key: string) => key } },
        { provide: LocalizedPathService, useValue: { localize: (path: string) => path } },
      ],
    });
    controller = TestBed.inject(BornDayController);
    state = TestBed.inject(BornDayState);
    state.celebrities.set([CELEBRITY]);
  });

  describe('addToCalendar', () => {
    it('opens the Add dialog prefilled with the celebrity when signed in', () => {
      authStatus.set('signedIn');

      controller.addToCalendar('Q7259');

      expect(authController.signInWithGoogle).not.toHaveBeenCalled();
      expect(birthdayDialogController.openAddBirthdayDialogWithDraft).toHaveBeenCalledWith(toCelebrityBirthdayDraft(CELEBRITY));
    });

    it('signs in first and then opens the dialog when signed out', () => {
      controller.addToCalendar('Q7259');

      expect(authController.signInWithGoogle).toHaveBeenCalled();
      expect(state.isSigningIn()).toBe(true);
      expect(birthdayDialogController.openAddBirthdayDialogWithDraft).not.toHaveBeenCalled();

      finishSignIn('signedIn');

      expect(state.isSigningIn()).toBe(false);
      expect(birthdayDialogController.openAddBirthdayDialogWithDraft).toHaveBeenCalledWith(toCelebrityBirthdayDraft(CELEBRITY));
    });

    it('opens no dialog when the sign-in is cancelled', () => {
      controller.addToCalendar('Q7259');
      finishSignIn('signedOut');

      expect(state.isSigningIn()).toBe(false);
      expect(birthdayDialogController.openAddBirthdayDialogWithDraft).not.toHaveBeenCalled();
    });

    it('waits while the session is being restored', () => {
      authStatus.set('unknown');

      controller.addToCalendar('Q7259');

      expect(authController.signInWithGoogle).not.toHaveBeenCalled();
      expect(birthdayDialogController.openAddBirthdayDialogWithDraft).not.toHaveBeenCalled();
    });

    it('ignores a second click while signing in', () => {
      controller.addToCalendar('Q7259');
      controller.addToCalendar('Q7259');

      expect(authController.signInWithGoogle).toHaveBeenCalledTimes(1);
    });

    it('does nothing for a person who is not shown', () => {
      authStatus.set('signedIn');

      controller.addToCalendar('Q42');

      expect(authController.signInWithGoogle).not.toHaveBeenCalled();
      expect(birthdayDialogController.openAddBirthdayDialogWithDraft).not.toHaveBeenCalled();
    });
  });
});
