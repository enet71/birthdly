import { BirthdayPhotoChange } from '@birthday/web-birthdays-data-access';

// The photo shown in the dialog and what saving does with it.
export interface BirthdayDialogPhoto {
  previewUrl: string | null;
  change: BirthdayPhotoChange;
}
