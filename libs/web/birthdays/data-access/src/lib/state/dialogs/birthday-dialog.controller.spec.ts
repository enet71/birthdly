import type { Mock } from 'vitest';
import { computed, signal, Signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { AuthController, AuthState, AuthStatus } from '@birthday/web-auth-data-access';
import { Birthday } from '@birthday/web-birthdays-util';
import { BirthdayDialogData, BirthdayDialogDraft } from '../../types';
import { BirthdayDialogController } from './birthday-dialog.controller';
import { BirthdayDialogState } from './birthday-dialog.state';

const DRAFT: BirthdayDialogDraft = { name: 'Ada Lovelace', birthDate: '1815-12-10', relationship: 'celebrity', notes: null, photo: null };
const LOCAL_BIRTHDAY = { id: 'local-1', name: 'Liam', birthDate: '1999-10-25' } as Birthday;

describe('BirthdayDialogController', () => {
  let controller: BirthdayDialogController;
  let state: BirthdayDialogState;
  let authStatus: WritableSignal<AuthStatus>;
  let signIn: Subject<void>;
  const authController: { signInWithGoogle: Mock<AuthController['signInWithGoogle']> } = { signInWithGoogle: vi.fn() };

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
        { provide: AuthState, useValue: authState },
        { provide: AuthController, useValue: authController },
      ],
    });
    controller = TestBed.inject(BirthdayDialogController);
    state = TestBed.inject(BirthdayDialogState);
  });

  it('opens the Add dialog with the draft on its birth date', () => {
    controller.openAddBirthdayDialogWithDraft(DRAFT);

    expect(state.dialog()).toEqual({ date: new Date(1815, 11, 10), draft: DRAFT });
  });

  describe('closeBirthdayDialogIfCurrent', () => {
    it('closes the dialog it was given', () => {
      controller.openAddBirthdayDialogWithDraft(DRAFT);
      const dialog: BirthdayDialogData | null = state.dialog();

      controller.closeBirthdayDialogIfCurrent(dialog);

      expect(state.dialog()).toBeNull();
    });

    it('keeps a dialog opened after the given one', () => {
      controller.openAddBirthdayDialogWithDraft(DRAFT);
      const previous: BirthdayDialogData | null = state.dialog();
      controller.openAddBirthdayDialogWithDraft(DRAFT);
      const current: BirthdayDialogData | null = state.dialog();

      controller.closeBirthdayDialogIfCurrent(previous);

      expect(state.dialog()).toBe(current);
    });
  });

  describe('signInToAddPhoto', () => {
    it('marks the sign-in as running until it finishes', () => {
      controller.openAddBirthdayDialog();

      controller.signInToAddPhoto();

      expect(state.isSigningIn()).toBe(true);

      finishSignIn('signedIn');

      expect(state.isSigningIn()).toBe(false);
    });

    it('ignores a second click while signing in', () => {
      controller.openAddBirthdayDialog();

      controller.signInToAddPhoto();
      controller.signInToAddPhoto();

      expect(authController.signInWithGoogle).toHaveBeenCalledTimes(1);
    });

    it('closes the Edit dialog of a local birthday after signing in', () => {
      controller.openEditBirthdayDialog(LOCAL_BIRTHDAY);

      controller.signInToAddPhoto();
      finishSignIn('signedIn');

      expect(state.dialog()).toBeNull();
    });

    it('keeps the Add dialog open after signing in', () => {
      controller.openAddBirthdayDialogWithDraft(DRAFT);
      const dialog: BirthdayDialogData | null = state.dialog();

      controller.signInToAddPhoto();
      finishSignIn('signedIn');

      expect(state.dialog()).toBe(dialog);
    });

    it('keeps the Edit dialog open when the sign-in is cancelled', () => {
      controller.openEditBirthdayDialog(LOCAL_BIRTHDAY);
      const dialog: BirthdayDialogData | null = state.dialog();

      controller.signInToAddPhoto();
      finishSignIn('signedOut');

      expect(state.dialog()).toBe(dialog);
      expect(state.isSigningIn()).toBe(false);
    });
  });
});
