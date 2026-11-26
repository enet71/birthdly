import type { Mock } from 'vitest';
import { signal, Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthState, AuthStatus } from '@birthday/web-auth-data-access';
import { BirthdayDialogData, BirthdayDialogDraft, BirthdayFormModel } from '@birthday/web-birthdays-data-access';
import { Birthday } from '@birthday/web-birthdays-util';
import { BirthdayFormController } from '../../state';
import { BirthdayDialogPhoto } from '../../types';
import { BirthdayDialogComponent } from './birthday-dialog.component';

const DRAFT: BirthdayDialogDraft = {
  name: 'Ada Lovelace',
  birthDate: '1815-12-10',
  relationship: 'celebrity',
  notes: 'https://en.wikipedia.org/wiki/Ada_Lovelace',
  photo: {
    previewUrl: 'https://images.test/120px-Ada.jpg',
    sourceUrls: ['https://images.test/330px-Ada.jpg', 'https://images.test/120px-Ada.jpg'],
  },
};

describe('BirthdayDialogComponent', () => {
  const birthdayFormController: {
    saveBirthday: Mock<BirthdayFormController['saveBirthday']>;
    deleteBirthday: Mock<BirthdayFormController['deleteBirthday']>;
    signInToAddPhoto: Mock<BirthdayFormController['signInToAddPhoto']>;
  } = {
    saveBirthday: vi.fn(),
    deleteBirthday: vi.fn(),
    signInToAddPhoto: vi.fn(),
  };

  // Only the class logic is tested, so the template, its styles and its children are left out.
  function createComponent(data: BirthdayDialogData): BirthdayDialogComponent {
    TestBed.configureTestingModule({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: BirthdayFormController, useValue: birthdayFormController },
        {
          provide: AuthState,
          useValue: { status: signal<AuthStatus>('signedIn'), isAuthenticated: signal(true) } satisfies {
            status: Signal<AuthStatus>;
            isAuthenticated: Signal<boolean>;
          },
        },
      ],
    });
    TestBed.overrideComponent(BirthdayDialogComponent, {
      set: { template: '', templateUrl: undefined, styleUrl: undefined, styleUrls: undefined, imports: [] },
    });

    return TestBed.createComponent(BirthdayDialogComponent).componentInstance;
  }

  beforeEach(() => vi.clearAllMocks());

  describe('with a draft', () => {
    it('prefills the form from the draft', () => {
      const component: BirthdayDialogComponent = createComponent({ date: new Date(1815, 11, 10), draft: DRAFT });

      expect(component['model']()).toEqual({
        name: 'Ada Lovelace',
        month: 12,
        day: 10,
        year: '1815',
        relationship: 'celebrity',
        notes: 'https://en.wikipedia.org/wiki/Ada_Lovelace',
      } satisfies BirthdayFormModel);
    });

    it('leaves the year empty for the unknown-year marker', () => {
      const component: BirthdayDialogComponent = createComponent({
        date: new Date(4, 1, 29),
        draft: { ...DRAFT, birthDate: '0004-02-29', notes: null },
      });

      expect(component['model']()).toEqual(expect.objectContaining({ month: 2, day: 29, year: '', notes: '' }));
    });

    it('shows the draft photo and stores it from its URLs on save', () => {
      const component: BirthdayDialogComponent = createComponent({ date: new Date(1815, 11, 10), draft: DRAFT });

      expect(component['photo']()).toEqual({
        previewUrl: 'https://images.test/120px-Ada.jpg',
        change: { kind: 'url', sourceUrls: ['https://images.test/330px-Ada.jpg', 'https://images.test/120px-Ada.jpg'] },
      } satisfies BirthdayDialogPhoto);
    });

    it('drops the draft photo without deleting anything when it is removed', () => {
      const component: BirthdayDialogComponent = createComponent({ date: new Date(1815, 11, 10), draft: DRAFT });

      component['removePhoto']();

      expect(component['photo']()).toEqual({ previewUrl: null, change: { kind: 'keep' } } satisfies BirthdayDialogPhoto);
    });
  });

  describe('editing a birthday', () => {
    const BIRTHDAY = {
      id: '1',
      name: 'Liam',
      birthDate: '1999-10-25',
      relationship: 'friends',
      notes: null,
      photoUrl: 'https://photos.test/1.webp',
    } as Birthday;

    it('keeps the stored photo', () => {
      const component: BirthdayDialogComponent = createComponent({ date: new Date(1999, 9, 25), birthday: BIRTHDAY });

      expect(component['photo']()).toEqual({ previewUrl: 'https://photos.test/1.webp', change: { kind: 'keep' } } satisfies BirthdayDialogPhoto);
    });

    it('deletes the stored photo on save when it is removed', () => {
      const component: BirthdayDialogComponent = createComponent({ date: new Date(1999, 9, 25), birthday: BIRTHDAY });

      component['removePhoto']();

      expect(component['photo']()).toEqual({ previewUrl: null, change: { kind: 'remove' } } satisfies BirthdayDialogPhoto);
    });

    it('changes nothing on save when a birthday without a photo has its photo removed', () => {
      const component: BirthdayDialogComponent = createComponent({ date: new Date(1999, 9, 25), birthday: { ...BIRTHDAY, photoUrl: null } });

      component['removePhoto']();

      expect(component['photo']()).toEqual({ previewUrl: null, change: { kind: 'keep' } } satisfies BirthdayDialogPhoto);
    });
  });
});
