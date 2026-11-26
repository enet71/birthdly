import type { Mock } from 'vitest';
import { computed, signal, Signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EMPTY, of, Subject } from 'rxjs';
import { AuthState, AuthStatus } from '@birthday/web-auth-data-access';
import {
  BirthdayDialogController,
  BirthdayDialogData,
  BirthdayDialogState,
  BirthdayFormModel,
  BirthdayPhotoChange,
  BirthdaysController,
} from '@birthday/web-birthdays-data-access';
import { Birthday } from '@birthday/web-birthdays-util';
import { BirthdayFormController } from './birthday-form.controller';

const MODEL: BirthdayFormModel = { name: 'Ada Lovelace', month: 12, day: 10, year: '1815', relationship: 'celebrity', notes: '' };
const SAVED = { id: 'saved-1', name: 'Ada Lovelace', birthDate: '1815-12-10' } as Birthday;
const IMAGE: Blob = new Blob(['image'], { type: 'image/jpeg' });

describe('BirthdayFormController', () => {
  let controller: BirthdayFormController;
  let dialogState: BirthdayDialogState;
  let authStatus: WritableSignal<AuthStatus>;
  let saved: Subject<Birthday>;
  const birthdaysController: {
    addBirthday: Mock<BirthdaysController['addBirthday']>;
    updateBirthday: Mock<BirthdaysController['updateBirthday']>;
    setPhoto: Mock<BirthdaysController['setPhoto']>;
    setPhotoFromUrls: Mock<BirthdaysController['setPhotoFromUrls']>;
    removePhoto: Mock<BirthdaysController['removePhoto']>;
  } = {
    addBirthday: vi.fn(),
    updateBirthday: vi.fn(),
    setPhoto: vi.fn(),
    setPhotoFromUrls: vi.fn(),
    removePhoto: vi.fn(),
  };
  const birthdayDialogController: { closeBirthdayDialogIfCurrent: Mock<BirthdayDialogController['closeBirthdayDialogIfCurrent']> } = {
    closeBirthdayDialogIfCurrent: vi.fn(),
  };

  function openDialog(data: BirthdayDialogData): BirthdayDialogData {
    dialogState.dialog.set(data);
    return data;
  }

  function saveAndFinish(change: BirthdayPhotoChange): void {
    controller.saveBirthday(MODEL, change);
    saved.next(SAVED);
    saved.complete();
  }

  beforeEach(() => {
    vi.clearAllMocks();
    authStatus = signal<AuthStatus>('signedIn');
    saved = new Subject<Birthday>();
    birthdaysController.addBirthday.mockReturnValue(saved);
    birthdaysController.updateBirthday.mockReturnValue(saved);
    birthdaysController.setPhoto.mockReturnValue(of(SAVED));
    birthdaysController.setPhotoFromUrls.mockReturnValue(of(SAVED));
    birthdaysController.removePhoto.mockReturnValue(of(SAVED));
    const authState: { status: Signal<AuthStatus>; isAuthenticated: Signal<boolean> } = {
      status: authStatus,
      isAuthenticated: computed(() => authStatus() === 'signedIn'),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthState, useValue: authState },
        { provide: BirthdaysController, useValue: birthdaysController },
        { provide: BirthdayDialogController, useValue: birthdayDialogController },
      ],
    });
    controller = TestBed.inject(BirthdayFormController);
    dialogState = TestBed.inject(BirthdayDialogState);
  });

  it('adds a birthday from the form in the Add dialog', () => {
    openDialog({ date: new Date(1815, 11, 10) });

    controller.saveBirthday(MODEL, { kind: 'keep' });

    expect(birthdaysController.addBirthday).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      date: new Date(1815, 11, 10),
      isYearKnown: true,
      relationship: 'celebrity',
      notes: '',
    });
  });

  it('closes the dialog it was saved from once the birthday is saved', () => {
    const dialog: BirthdayDialogData = openDialog({ date: new Date(1815, 11, 10) });

    controller.saveBirthday(MODEL, { kind: 'keep' });

    expect(birthdayDialogController.closeBirthdayDialogIfCurrent).not.toHaveBeenCalled();

    saved.next(SAVED);

    expect(birthdayDialogController.closeBirthdayDialogIfCurrent).toHaveBeenCalledWith(dialog);
  });

  it('changes the photo only after the birthday is saved', () => {
    openDialog({ date: new Date(1815, 11, 10) });

    controller.saveBirthday(MODEL, { kind: 'file', image: IMAGE });

    expect(birthdaysController.setPhoto).not.toHaveBeenCalled();

    saved.next(SAVED);

    expect(birthdaysController.setPhoto).toHaveBeenCalledWith('saved-1', IMAGE);
  });

  it('downloads the photo from the draft URLs', () => {
    openDialog({ date: new Date(1815, 11, 10) });

    saveAndFinish({ kind: 'url', sourceUrls: ['https://images.test/330px.jpg', 'https://images.test/120px.jpg'] });

    expect(birthdaysController.setPhotoFromUrls).toHaveBeenCalledWith('saved-1', ['https://images.test/330px.jpg', 'https://images.test/120px.jpg']);
  });

  it('removes the photo of the edited birthday', () => {
    const birthday = { id: 'saved-1', photoUrl: 'https://photos.test/1.webp' } as Birthday;
    openDialog({ date: new Date(1815, 11, 10), birthday });

    saveAndFinish({ kind: 'remove' });

    expect(birthdaysController.updateBirthday).toHaveBeenCalledWith('saved-1', expect.objectContaining({ name: 'Ada Lovelace' }));
    expect(birthdaysController.removePhoto).toHaveBeenCalledWith('saved-1');
  });

  it('leaves the photo alone when it is kept', () => {
    openDialog({ date: new Date(1815, 11, 10) });

    saveAndFinish({ kind: 'keep' });

    expect(birthdaysController.setPhoto).not.toHaveBeenCalled();
    expect(birthdaysController.setPhotoFromUrls).not.toHaveBeenCalled();
    expect(birthdaysController.removePhoto).not.toHaveBeenCalled();
  });

  it('saves no photo while signed out', () => {
    authStatus.set('signedOut');
    openDialog({ date: new Date(1815, 11, 10) });

    saveAndFinish({ kind: 'file', image: IMAGE });

    expect(birthdayDialogController.closeBirthdayDialogIfCurrent).toHaveBeenCalled();
    expect(birthdaysController.setPhoto).not.toHaveBeenCalled();
  });

  it('keeps the dialog open and changes no photo when the birthday fails to save', () => {
    birthdaysController.addBirthday.mockReturnValue(EMPTY);
    openDialog({ date: new Date(1815, 11, 10) });

    controller.saveBirthday(MODEL, { kind: 'url', sourceUrls: ['https://images.test/120px.jpg'] });

    expect(birthdayDialogController.closeBirthdayDialogIfCurrent).not.toHaveBeenCalled();
    expect(birthdaysController.setPhotoFromUrls).not.toHaveBeenCalled();
  });
});
