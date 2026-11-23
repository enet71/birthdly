import { Controller, Get } from '@nestjs/common';
import { AdminOnly } from '@birthday/api-auth';
import { FeedbackDto } from '@birthday/shared-models';
import { FeedbackService } from '../services';

// The newest feedback messages for the admin page.
@AdminOnly()
@Controller('admin/feedback')
export class FeedbackAdminController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  public list(): Promise<FeedbackDto[]> {
    return this.feedbackService.list();
  }
}
