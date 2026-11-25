import { BirthdayRelationship } from '@birthday/shared-models';
import { Birthday } from '@birthday/web-birthdays-util';

// Opens the dialog in edit mode when `birthday` is set.
export interface BirthdayDialogData {
  date: Date;
  birthday?: Birthday;
}

export interface BirthdayFormModel {
  name: string;
  // 1–12.
  month: number;
  day: number;
  // Empty when the birth year is unknown.
  year: string;
  relationship: BirthdayRelationship | null;
  notes: string;
}
