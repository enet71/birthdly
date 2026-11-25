import { z } from 'zod';
import { APP_LOCALES, RoadmapRequest } from '@birthday/shared-models';

export const roadmapRequestSchema = z.strictObject({
  locale: z.enum(APP_LOCALES),
}) satisfies z.ZodType<RoadmapRequest>;
