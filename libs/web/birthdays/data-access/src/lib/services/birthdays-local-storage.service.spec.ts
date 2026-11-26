import { TestBed } from '@angular/core/testing';
import { BirthdayDto } from '@birthday/shared-models';
import { LocalStorageKey } from '@birthday/web-shared-util';
import { BirthdaysLocalStorageService } from './birthdays-local-storage.service';

describe('BirthdaysLocalStorageService', () => {
  let service: BirthdaysLocalStorageService;

  beforeEach(() => {
    localStorage.clear();
    service = TestBed.inject(BirthdaysLocalStorageService);
  });

  afterEach(() => localStorage.clear());

  it('reads back a birthday stored with the celebrity relationship', () => {
    const stored: BirthdayDto = {
      id: '1',
      name: 'Ada Lovelace',
      birthDate: '1815-12-10',
      relationship: 'celebrity',
      notes: null,
      photoUrl: null,
    };
    localStorage.setItem(LocalStorageKey.BIRTHDAYS, JSON.stringify([stored]));

    let birthdays: BirthdayDto[] = [];
    service.getAll().subscribe((value: BirthdayDto[]) => (birthdays = value));

    expect(birthdays).toEqual([stored]);
  });

  it('clears an unknown stored relationship', () => {
    localStorage.setItem(LocalStorageKey.BIRTHDAYS, JSON.stringify([{ id: '1', name: 'Ada', birthDate: '1815-12-10', relationship: 'idol' }]));

    let birthdays: BirthdayDto[] = [];
    service.getAll().subscribe((value: BirthdayDto[]) => (birthdays = value));

    expect(birthdays[0].relationship).toBeNull();
  });
});
