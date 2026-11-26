import { RelationshipOption } from '../types';

// Birthdays without a known year are stored in this year. It is the smallest leap year Postgres accepts, so Feb 29 fits.
export const UNKNOWN_BIRTH_YEAR = 4;

// Matches the database limit for birthday notes.
export const BIRTHDAY_NOTES_MAX_LENGTH = 500;

// In this order in the birthday dialog, the People filter, and the People sort; labels are translation keys.
export const RELATIONSHIP_OPTIONS: RelationshipOption[] = [
  { value: 'family', label: 'relationship.family' },
  { value: 'friends', label: 'relationship.friends' },
  { value: 'colleagues', label: 'relationship.colleagues' },
  { value: 'celebrity', label: 'relationship.celebrity' },
  { value: 'other', label: 'relationship.other' },
];
