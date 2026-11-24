import { users } from '@birthday/api-database';
import { AuthUser, AuthUserRow } from '../types';

// The columns every query that returns the signed-in user selects; `toAuthUser` turns the row into the API shape.
export const AUTH_USER_COLUMNS: Pick<
  (typeof users)['_']['columns'],
  'id' | 'email' | 'name' | 'displayName' | 'picture' | 'birthDate' | 'createdAt'
> = {
  id: users.id,
  email: users.email,
  name: users.name,
  displayName: users.displayName,
  picture: users.picture,
  birthDate: users.birthDate,
  createdAt: users.createdAt,
};

export function toAuthUser(row: AuthUserRow): AuthUser {
  return { ...row, createdAt: row.createdAt.toISOString() };
}
