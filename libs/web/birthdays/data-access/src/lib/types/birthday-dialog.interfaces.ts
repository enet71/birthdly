import { BirthdayRelationship, CreateBirthdayRequest } from '@birthday/shared-models';
import { Birthday } from '@birthday/web-birthdays-util';

// Opens the dialog in edit mode when `birthday` is set. In add mode, `draft` prefills the form.
export interface BirthdayDialogData {
  date: Date;
  birthday?: Birthday;
  draft?: BirthdayDialogDraft;
}

export interface BirthdayDialogDraft extends CreateBirthdayRequest {
  photo: BirthdayDraftPhoto | null;
}

// A photo from another site that is stored as the person's photo when the dialog is saved.
export interface BirthdayDraftPhoto {
  previewUrl: string;
  // Tried in order until one downloads.
  sourceUrls: string[];
}

// What saving the dialog does with the photo.
export type BirthdayPhotoChange = { kind: 'keep' } | { kind: 'remove' } | { kind: 'file'; image: Blob } | { kind: 'url'; sourceUrls: string[] };

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
