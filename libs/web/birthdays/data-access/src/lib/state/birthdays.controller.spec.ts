import type { Mock } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthApiService } from '@birthday/web-auth-data-access';
import { AppTranslateService } from '@birthday/web-shared-i18n';
import { AnalyticsService, NotificationsService } from '@birthday/web-shared-util';
import { Birthday, UpcomingBirthday } from '@birthday/web-birthdays-util';
import { BirthdaysDataService, BirthdaysApiService, BirthdaysLocalStorageService, RemotePhotosApiService } from '../services';
import { BirthdayInput } from '../types';
import { BirthdaysController } from './birthdays.controller';
import { BirthdaysState } from './birthdays.state';

const LIAM: BirthdayInput = { name: 'Liam', date: new Date(1999, 9, 25), isYearKnown: true, relationship: null, notes: '' };

describe('BirthdaysController', () => {
  let controller: BirthdaysController;
  let state: BirthdaysState;
  const remotePhotosApi: { download: Mock<RemotePhotosApiService['download']> } = { download: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    // State computes `today` at construction, so the time is set before injecting it.
    vi.setSystemTime(new Date(2026, 9, 23, 14, 30));
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthApiService, useValue: { userChanges: () => of(null) } },
        // Signed out, so the account storage is never called.
        { provide: BirthdaysApiService, useValue: {} },
        { provide: RemotePhotosApiService, useValue: remotePhotosApi },
        BirthdaysState,
        BirthdaysController,
        {
          provide: BirthdaysDataService,
          useExisting: BirthdaysLocalStorageService,
        },
        {
          provide: NotificationsService,
          useValue: { createErrorNotification: vi.fn() },
        },
        { provide: AnalyticsService, useValue: { track: vi.fn() } },
        // Error messages are translated; the tests check the workflow, not the texts.
        {
          provide: AppTranslateService,
          useValue: { translate: (key: string) => key, translatePlural: (key: string) => key },
        },
      ],
    });
    controller = TestBed.inject(BirthdaysController);
    state = TestBed.inject(BirthdaysState);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  describe('addBirthday', () => {
    it('appends a birthday with a trimmed name and a yyyy-MM-dd birth date', () => {
      controller.addBirthday({ ...LIAM, name: '  Liam  ', date: new Date(1999, 9, 25, 18, 45) }).subscribe();

      expect(state.birthdays()).toEqual([
        { id: expect.any(String), name: 'Liam', birthDate: '1999-10-25', relationship: null, notes: null, photoUrl: null },
      ]);
    });

    it('gives every added birthday a unique id', () => {
      controller.addBirthday(LIAM).subscribe();
      controller.addBirthday(LIAM).subscribe();

      const ids: string[] = state.birthdays().map((birthday: Birthday) => birthday.id);

      expect(new Set(ids).size).toBe(ids.length);
    });

    it('updates upcoming birthdays with the added birthday', () => {
      controller.addBirthday(LIAM).subscribe();

      const first: UpcomingBirthday = state.upcomingBirthdays()[0];

      expect(first.birthday.name).toBe('Liam');
      expect(first.date).toEqual(new Date(2026, 9, 25));
      expect(first.daysUntil).toBe(2);
    });
  });

  describe('setPhotoFromUrls', () => {
    const IMAGE: Blob = new Blob(['image'], { type: 'image/jpeg' });
    const SAVED = { id: '1', photoUrl: 'https://photos.test/1.webp' } as Birthday;
    let setPhoto: Mock<BirthdaysController['setPhoto']>;

    beforeEach(() => {
      setPhoto = vi.spyOn(controller, 'setPhoto').mockReturnValue(of(SAVED));
    });

    it('stores the first image that downloads', () => {
      remotePhotosApi.download.mockReturnValue(of(IMAGE));
      const emitted: Mock<(birthday: Birthday) => void> = vi.fn();

      controller.setPhotoFromUrls('1', ['https://images.test/330px.jpg', 'https://images.test/120px.jpg']).subscribe(emitted);

      expect(remotePhotosApi.download).toHaveBeenCalledTimes(1);
      expect(remotePhotosApi.download).toHaveBeenCalledWith('https://images.test/330px.jpg');
      expect(setPhoto).toHaveBeenCalledWith('1', IMAGE);
      expect(emitted).toHaveBeenCalledWith(SAVED);
    });

    it('falls back to the next URL when an image fails to download', () => {
      remotePhotosApi.download.mockImplementation((url: string) => (url.includes('330px') ? throwError(() => new Error('404')) : of(IMAGE)));

      controller.setPhotoFromUrls('1', ['https://images.test/330px.jpg', 'https://images.test/120px.jpg']).subscribe();

      expect(remotePhotosApi.download).toHaveBeenCalledWith('https://images.test/120px.jpg');
      expect(setPhoto).toHaveBeenCalledWith('1', IMAGE);
    });

    it('shows an error and completes without a birthday when no image downloads', () => {
      remotePhotosApi.download.mockReturnValue(throwError(() => new Error('CORS')));
      const emitted: Mock<(birthday: Birthday) => void> = vi.fn();
      const completed: Mock<() => void> = vi.fn();

      controller
        .setPhotoFromUrls('1', ['https://images.test/330px.jpg', 'https://images.test/120px.jpg'])
        .subscribe({ next: emitted, complete: completed });

      expect(setPhoto).not.toHaveBeenCalled();
      expect(TestBed.inject(NotificationsService).createErrorNotification).toHaveBeenCalledWith('notifications.birthdays.photoSaveFailed');
      expect(emitted).not.toHaveBeenCalled();
      expect(completed).toHaveBeenCalled();
    });
  });

  it('clears the birthdays when the state is reset after adding', () => {
    controller.addBirthday(LIAM).subscribe();

    state.resetState();

    expect(state.birthdays()).toEqual([]);
  });
});
