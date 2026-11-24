import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser } from '../decorators';
import { updateProfileSchema } from '../schemas';
import { AuthUsersService } from '../services';
import { AuthUser } from '../types';

@Controller('me')
export class MeController {
  constructor(private readonly authUsers: AuthUsersService) {}

  @Get()
  public me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  // Answers the updated user.
  @Patch()
  public updateProfile(@CurrentUser() user: AuthUser, @Body() body: unknown): Promise<AuthUser> {
    return this.authUsers.updateProfile(user.id, updateProfileSchema.parse(body));
  }
}
