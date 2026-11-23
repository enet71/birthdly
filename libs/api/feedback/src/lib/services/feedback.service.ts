import { Inject, Injectable } from '@nestjs/common';
import { desc } from 'drizzle-orm';
import { CreateFeedbackRequest, FEEDBACK_ADMIN_LIST_LIMIT, FeedbackDto } from '@birthday/shared-models';
import { DATABASE, Database, feedback } from '@birthday/api-database';
import { FEEDBACK_USER_AGENT_MAX_LENGTH } from '../constants';

@Injectable()
export class FeedbackService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  // A filled honeypot gets the same answer as a real message, so a bot does not learn it was dropped.
  public async create(request: CreateFeedbackRequest, userId: string | null, userAgent: string | undefined): Promise<void> {
    if (request.website) {
      return;
    }

    await this.db.insert(feedback).values({
      userId,
      type: request.type,
      message: request.message,
      email: request.email,
      locale: request.locale,
      userAgent: userAgent ? [...userAgent].slice(0, FEEDBACK_USER_AGENT_MAX_LENGTH).join('') : null,
    });
  }

  public async list(): Promise<FeedbackDto[]> {
    const rows = await this.db.select().from(feedback).orderBy(desc(feedback.createdAt)).limit(FEEDBACK_ADMIN_LIST_LIMIT);

    return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
  }
}
