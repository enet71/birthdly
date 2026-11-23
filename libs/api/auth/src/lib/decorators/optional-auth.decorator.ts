import { CustomDecorator, SetMetadata } from '@nestjs/common';
import { IS_OPTIONAL_AUTH_KEY } from '../constants';

// Open to everyone, like `@Public()`, but a valid session still resolves the user for `@OptionalCurrentUser()`.
export const OptionalAuth = (): CustomDecorator<string> => SetMetadata(IS_OPTIONAL_AUTH_KEY, true);
