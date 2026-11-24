ALTER TABLE "users" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "birth_date" date;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_display_name_check" CHECK (length(trim("users"."display_name")) between 1 and 200);