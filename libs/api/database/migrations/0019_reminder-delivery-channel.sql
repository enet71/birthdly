ALTER TABLE "notification_deliveries" ADD COLUMN "channel" text DEFAULT 'browser' NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_deliveries" DROP CONSTRAINT "notification_deliveries_user_id_local_date_minute_of_day_pk";--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_slot_channel_pk" PRIMARY KEY("user_id","local_date","minute_of_day","channel");
