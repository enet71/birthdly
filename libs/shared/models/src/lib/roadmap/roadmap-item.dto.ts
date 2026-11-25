export const ROADMAP_ITEM_STATUSES = ['in_progress', 'planned', 'done'] as const;

export type RoadmapItemStatus = (typeof ROADMAP_ITEM_STATUSES)[number];

// The area of the app an item belongs to; the web app translates it into a chip label.
export const ROADMAP_ITEM_CATEGORIES = ['calendar', 'people', 'reminders', 'integrations', 'celebrities', 'account', 'app'] as const;

export type RoadmapItemCategory = (typeof ROADMAP_ITEM_CATEGORIES)[number];

// A roadmap item with its texts in the requested language, or in English when they have no translation.
export interface RoadmapItemDto {
  id: string;
  status: RoadmapItemStatus;
  // A Material Symbols name, for example `notifications`.
  icon: string;
  category: RoadmapItemCategory;
  title: string;
  description: string;
  // `yyyy-MM-dd`; set only for released items.
  releasedOn: string | null;
}
