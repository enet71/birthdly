import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../types';

// The signed-in user on an `@OptionalAuth()` endpoint, or null for a signed-out visitor.
export const OptionalCurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser | null => context.switchToHttp().getRequest<{ user?: AuthUser }>().user ?? null,
);
