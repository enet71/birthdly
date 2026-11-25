CREATE TABLE "roadmap_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" text NOT NULL,
	"icon" text NOT NULL,
	"category" text NOT NULL,
	"title" jsonb NOT NULL,
	"description" jsonb NOT NULL,
	"released_on" date,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roadmap_items_status_check" CHECK ("roadmap_items"."status" in ('in_progress', 'planned', 'done')),
	CONSTRAINT "roadmap_items_category_check" CHECK ("roadmap_items"."category" in ('calendar', 'people', 'reminders', 'integrations', 'celebrities', 'account', 'app')),
	CONSTRAINT "roadmap_items_released_on_check" CHECK (("roadmap_items"."status" = 'done') = ("roadmap_items"."released_on" is not null)),
	CONSTRAINT "roadmap_items_title_check" CHECK (coalesce(length(trim("roadmap_items"."title" ->> 'en')), 0) > 0),
	CONSTRAINT "roadmap_items_description_check" CHECK (coalesce(length(trim("roadmap_items"."description" ->> 'en')), 0) > 0)
);
