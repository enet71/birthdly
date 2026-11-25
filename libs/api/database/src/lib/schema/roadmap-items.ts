import { sql } from 'drizzle-orm';
import { check, date, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Texts per app language; English is required, the others fall back to it.
export type RoadmapItemTexts = Partial<Record<'es' | 'de' | 'fr' | 'ru' | 'uk', string>> & { en: string };

// The public roadmap page's items; see libs/api/roadmap. Migrations add and change them until an admin page exists.
export const roadmapItems = pgTable(
  'roadmap_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    status: text('status', { enum: ['in_progress', 'planned', 'done'] }).notNull(),
    // A Material Symbols name.
    icon: text('icon').notNull(),
    category: text('category', { enum: ['calendar', 'people', 'reminders', 'integrations', 'celebrities', 'account', 'app'] }).notNull(),
    title: jsonb('title').$type<RoadmapItemTexts>().notNull(),
    description: jsonb('description').$type<RoadmapItemTexts>().notNull(),
    // Required for released items; they are ordered by it, the newest first.
    releasedOn: date('released_on'),
    // The order of the items in progress and of the planned items.
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('roadmap_items_status_check', sql`${table.status} in ('in_progress', 'planned', 'done')`),
    check(
      'roadmap_items_category_check',
      sql`${table.category} in ('calendar', 'people', 'reminders', 'integrations', 'celebrities', 'account', 'app')`,
    ),
    check('roadmap_items_released_on_check', sql`(${table.status} = 'done') = (${table.releasedOn} is not null)`),
    check('roadmap_items_title_check', sql`coalesce(length(trim(${table.title} ->> 'en')), 0) > 0`),
    check('roadmap_items_description_check', sql`coalesce(length(trim(${table.description} ->> 'en')), 0) > 0`),
  ],
);
