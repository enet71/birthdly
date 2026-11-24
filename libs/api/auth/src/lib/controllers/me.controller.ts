import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UserDto } from '@birthday/shared-models';
import { CurrentUser } from '../decorators';
import { updateProfileSchema } from '../schemas';
import { AdminEmailsService, AuthUsersService } from '../services';
import { AuthUser } from '../types';

@Controller('me')
export class MeController {
  constructor(
    private readonly authUsers: AuthUsersService,
    private readonly adminEmails: AdminEmailsService,
  ) {}

  @Get()
  public me(@CurrentUser() user: AuthUser): UserDto {
    return this.toUserDto(user);
  }

  // Answers the updated user.
  @Patch()
  public async updateProfile(@CurrentUser() user: AuthUser, @Body() body: unknown): Promise<UserDto> {
    return this.toUserDto(await this.authUsers.updateProfile(user.id, updateProfileSchema.parse(body)));
  }

  private toUserDto(user: AuthUser): UserDto {
    return { ...user, isAdmin: this.adminEmails.isAdmin(user.email) };
  }
}
