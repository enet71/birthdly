import { Module } from '@nestjs/common';
import { FeedbackAdminController, FeedbackController } from './controllers';
import { FeedbackService } from './services';

@Module({
  controllers: [FeedbackController, FeedbackAdminController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
