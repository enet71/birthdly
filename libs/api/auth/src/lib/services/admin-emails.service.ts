import { Inject, Injectable } from '@nestjs/common';
import { MODULE_OPTIONS_TOKEN } from '../auth.module-definition';
import { AuthModuleOptions } from '../types';

// Knows which users are admins: those whose email is in `ADMIN_EMAILS`, compared case-insensitively.
@Injectable()
export class AdminEmailsService {
  private readonly adminEmails: Set<string>;

  constructor(@Inject(MODULE_OPTIONS_TOKEN) options: AuthModuleOptions) {
    this.adminEmails = new Set(options.adminEmails.map((email: string) => email.toLowerCase()));
  }

  public isAdmin(email: string): boolean {
    return this.adminEmails.has(email.toLowerCase());
  }
}
