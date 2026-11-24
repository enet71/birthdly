import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminEmailsService } from '../services';
import { AuthenticatedRequest } from '../types';
import { isAdminOnly } from '../utils';

// Lets only admins reach `@AdminOnly()` endpoints. Runs after `AuthGuard`, which has already rejected signed-out users.
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly adminEmails: AdminEmailsService,
  ) {}

  public canActivate(context: ExecutionContext): boolean {
    if (!isAdminOnly(this.reflector, context)) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<Partial<AuthenticatedRequest>>();

    if (!user || !this.adminEmails.isAdmin(user.email)) {
      throw new NotFoundException();
    }

    return true;
  }
}
