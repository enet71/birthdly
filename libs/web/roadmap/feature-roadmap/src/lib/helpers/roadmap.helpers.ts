import { RoadmapItemDto, RoadmapItemStatus } from '@birthday/shared-models';
import { ROADMAP_NEW_PERIOD_DAYS, ROADMAP_SECTION_ORDER } from '../constants';
import { RoadmapItem, RoadmapItemGroup, RoadmapSection } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

// One section per status that has items, in the page's order. The API already orders the items inside a status.
export function buildRoadmapSections(items: RoadmapItemDto[], today: Date): RoadmapSection[] {
  return ROADMAP_SECTION_ORDER.map((status: RoadmapItemStatus) =>
    toSection(
      status,
      items.filter((item: RoadmapItemDto) => item.status === status).map((item: RoadmapItemDto) => toItem(item, today)),
    ),
  ).filter((section: RoadmapSection) => section.count > 0);
}

function toSection(status: RoadmapItemStatus, items: RoadmapItem[]): RoadmapSection {
  return { status, count: items.length, groups: status === 'done' ? groupByMonth(items) : [{ releasedOn: null, items }] };
}

function toItem(item: RoadmapItemDto, today: Date): RoadmapItem {
  return { ...item, isNew: !!item.releasedOn && today.getTime() - toLocalDate(item.releasedOn).getTime() < ROADMAP_NEW_PERIOD_DAYS * DAY_MS };
}

// The items come newest first, so a month's items are next to each other.
function groupByMonth(items: RoadmapItem[]): RoadmapItemGroup[] {
  const groups: RoadmapItemGroup[] = [];

  for (const item of items) {
    const last: RoadmapItemGroup | undefined = groups.at(-1);

    if (last?.releasedOn && item.releasedOn && isSameMonth(last.releasedOn, item.releasedOn)) {
      last.items.push(item);
    } else {
      groups.push({ releasedOn: item.releasedOn, items: [item] });
    }
  }

  return groups;
}

// `yyyy-MM-dd` dates; the month is the first seven characters.
function isSameMonth(first: string, second: string): boolean {
  return first.slice(0, 7) === second.slice(0, 7);
}

function toLocalDate(date: string): Date {
  return new Date(`${date}T00:00:00`);
}
