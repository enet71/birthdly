ALTER TABLE "celebrities" ADD COLUMN "photo_file" text;--> statement-breakpoint
ALTER TABLE "celebrities" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "celebrities" ADD COLUMN "photo_author" text;--> statement-breakpoint
ALTER TABLE "celebrities" ADD COLUMN "photo_license" text;--> statement-breakpoint
ALTER TABLE "celebrities" ADD COLUMN "photo_license_url" text;--> statement-breakpoint
ALTER TABLE "celebrities" ADD COLUMN "photos_loaded_at" timestamp with time zone;