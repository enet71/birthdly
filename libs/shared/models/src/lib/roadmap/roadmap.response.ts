import { RoadmapItemDto } from './roadmap-item.dto';

// Items in progress and planned items in their set order, then released items, the newest first.
export interface RoadmapResponse {
  items: RoadmapItemDto[];
}
