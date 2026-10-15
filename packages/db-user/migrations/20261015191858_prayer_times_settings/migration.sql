CREATE TABLE `prayer_times_settings` (
	`id` text PRIMARY KEY,
	`hidden_prayer_times` text
);
--> statement-breakpoint
ALTER TABLE `believer_settings` ADD `location_follows_device` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `believer_settings` ADD `imsak_minutes` integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE `believer_settings` ADD `time_format` text;