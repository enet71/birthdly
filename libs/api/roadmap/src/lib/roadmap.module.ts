import { Module } from '@nestjs/common';
import { RoadmapController } from './controllers';
import { RoadmapService } from './services';

// The public roadmap; see README.md.
@Module({
  controllers: [RoadmapController],
  providers: [RoadmapService],
})
export class RoadmapModule {}
