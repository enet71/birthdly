import { RoadmapItemDto, RoadmapItemStatus } from '@birthday/shared-models';

export interface RoadmapItem extends RoadmapItemDto {
  // Released within `ROADMAP_NEW_PERIOD_DAYS`.
  isNew: boolean;
}

// Released items of one month, or all the items of a status that has no release dates.
export interface RoadmapItemGroup {
  // A release date in the month, for its label; `null` for a status without release dates.
  releasedOn: string | null;
  items: RoadmapItem[];
}

export interface RoadmapSection {
  status: RoadmapItemStatus;
  count: number;
  groups: RoadmapItemGroup[];
}
