// The signed-in user, as `GET /api/me` returns it.
export interface UserDto {
  id: string;
  email: string;
  // The name from the Google account.
  name: string | null;
  // The name the user set in the profile; shown instead of `name` when set.
  displayName: string | null;
  // The address of the Google profile picture.
  picture: string | null;
  // The user's own birthday, `yyyy-MM-dd`; the year 0004 marks an unknown birth year.
  birthDate: string | null;
  // When the account was created, an ISO 8601 date and time.
  createdAt: string;
  // The user is listed in the API's `ADMIN_EMAILS` and may open the admin pages.
  isAdmin: boolean;
}
