export interface AuthUser {
  id: string;
  email: string | null;
  // The name from the Google account.
  name: string | null;
  // The name the user set in the profile; shown instead of `name` when set.
  displayName: string | null;
  picture: string | null;
  // `yyyy-MM-dd`; the year 0004 marks an unknown birth year.
  birthDate: string | null;
  // An ISO 8601 date and time.
  createdAt: string;
}

// `unknown` until the stored session has been restored.
export type AuthStatus = 'unknown' | 'signedIn' | 'signedOut';
