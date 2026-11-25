import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '@birthday/api-auth';
import { RoadmapResponse } from '@birthday/shared-models';
import { roadmapRequestSchema } from '../schemas';
import { RoadmapService } from '../services';

// The public roadmap page's items; no sign-in. An unknown locale fails zod parsing; the API answers that with 400.
@Public()
@Controller('roadmap')
export class RoadmapController {
  constructor(private readonly roadmapService: RoadmapService) {}

  @Get()
  public list(@Query() query: unknown): Promise<RoadmapResponse> {
    return this.roadmapService.list(roadmapRequestSchema.parse(query));
  }
}
