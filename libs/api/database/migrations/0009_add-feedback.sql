CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"email" text,
	"locale" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_type_check" CHECK ("feedback"."type" in ('bug', 'idea', 'other')),
	CONSTRAINT "feedback_message_check" CHECK (length(trim("feedback"."message")) between 1 and 2000),
	CONSTRAINT "feedback_email_check" CHECK (length("feedback"."email") <= 254),
	CONSTRAINT "feedback_locale_check" CHECK ("feedback"."locale" in ('en', 'es', 'de', 'fr', 'ru', 'uk')),
	CONSTRAINT "feedback_user_agent_check" CHECK (length("feedback"."user_agent") <= 500)
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedback_user_id_idx" ON "feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "feedback_created_at_idx" ON "feedback" USING btree ("created_at");