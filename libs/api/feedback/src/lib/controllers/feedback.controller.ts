import { Body, Controller, Headers, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthUser, OptionalAuth, OptionalCurrentUser } from '@birthday/api-auth';
import { FEEDBACK_THROTTLES } from '../constants';
import { createFeedbackSchema } from '../schemas';
import { FeedbackService } from '../services';

// Open to signed-out visitors; a signed-in sender's messages are linked to the account.
@OptionalAuth()
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // 429 when this IP address sends too many.
  @Post()
  @UseGuards(ThrottlerGuard)
  @Throttle(FEEDBACK_THROTTLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  public create(@Body() body: unknown, @OptionalCurrentUser() user: AuthUser | null, @Headers('user-agent') userAgent?: string): Promise<void> {
    return this.feedbackService.create(createFeedbackSchema.parse(body), user?.id ?? null, userAgent);
  }
}
