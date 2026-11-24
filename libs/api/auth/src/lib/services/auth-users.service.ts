import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { UpdateProfileRequest } from '@birthday/shared-models';
import { DATABASE, Database, users } from '@birthday/api-database';
import { AuthUser, GoogleProfile } from '../types';
import { AUTH_USER_COLUMNS, toAuthUser } from '../utils';

@Injectable()
export class AuthUsersService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  // The first sign-in creates the user; later ones keep the email, name and picture in step with the Google account.
  // The profile fields the user set stay as they are.
  public async upsertGoogleUser(profile: GoogleProfile): Promise<AuthUser> {
    const [user] = await this.db
      .insert(users)
      .values({ googleSub: profile.sub, email: profile.email, name: profile.name, picture: profile.picture })
      .onConflictDoUpdate({ target: users.googleSub, set: { email: profile.email, name: profile.name, picture: profile.picture } })
      .returning(AUTH_USER_COLUMNS);

    return toAuthUser(user);
  }

  // Changes only the fields present in the request. The user exists: the request came with their session.
  public async updateProfile(userId: string, changes: UpdateProfileRequest): Promise<AuthUser> {
    const [user] = await this.db.update(users).set(changes).where(eq(users.id, userId)).returning(AUTH_USER_COLUMNS);

    return toAuthUser(user);
  }
}
