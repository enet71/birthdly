import { RoadmapItemStatus } from '@birthday/shared-models';

// The page shows the sections in this order.
export const ROADMAP_SECTION_ORDER: readonly RoadmapItemStatus[] = ['in_progress', 'planned', 'done'];

export const ROADMAP_STATUS_ICONS: Record<RoadmapItemStatus, string> = {
  in_progress: 'construction',
  planned: 'schedule',
  done: 'check_circle',
};

// A release shows its month and year; `LLLL` is the standalone month name, as in "ноябрь 2026".
export const ROADMAP_RELEASE_DATE_FORMAT = 'LLLL y';

// Released items this many days old or newer get the "New" badge.
export const ROADMAP_NEW_PERIOD_DAYS = 14;
