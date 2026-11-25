import { Inject, Injectable } from '@nestjs/common';
import { asc, desc, InferSelectModel, sql } from 'drizzle-orm';
import { AppLocale, RoadmapItemDto, RoadmapRequest, RoadmapResponse } from '@birthday/shared-models';
import { DATABASE, Database, roadmapItems, RoadmapItemTexts } from '@birthday/api-database';

type RoadmapItemRow = InferSelectModel<typeof roadmapItems>;

@Injectable()
export class RoadmapService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  public async list(request: RoadmapRequest): Promise<RoadmapResponse> {
    const rows: RoadmapItemRow[] = await this.db
      .select()
      .from(roadmapItems)
      .orderBy(
        sql`case ${roadmapItems.status} when 'in_progress' then 0 when 'planned' then 1 else 2 end`,
        desc(roadmapItems.releasedOn),
        asc(roadmapItems.sortOrder),
        asc(roadmapItems.createdAt),
        asc(roadmapItems.id),
      );

    return { items: rows.map((row: RoadmapItemRow) => toDto(row, request.locale)) };
  }
}

function toDto(row: RoadmapItemRow, locale: AppLocale): RoadmapItemDto {
  return {
    id: row.id,
    status: row.status,
    icon: row.icon,
    category: row.category,
    title: translate(row.title, locale),
    description: translate(row.description, locale),
    releasedOn: row.releasedOn,
  };
}

function translate(texts: RoadmapItemTexts, locale: AppLocale): string {
  return texts[locale] || texts.en;
}
