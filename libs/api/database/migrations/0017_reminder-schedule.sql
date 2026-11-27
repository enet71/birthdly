ALTER TABLE "notification_deliveries" ADD COLUMN "minute_of_day" smallint DEFAULT -1 NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_deliveries" DROP CONSTRAINT "notification_deliveries_user_id_local_date_pk";--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_user_id_local_date_minute_of_day_pk" PRIMARY KEY("user_id","local_date","minute_of_day");--> statement-breakpoint
ALTER TABLE "notification_settings" ADD COLUMN "schedule" jsonb;
