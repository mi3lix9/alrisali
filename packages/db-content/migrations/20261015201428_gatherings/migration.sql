CREATE TABLE `gatherings` (
	`id` text PRIMARY KEY,
	`title_ar` text NOT NULL,
	`title_en` text DEFAULT '' NOT NULL,
	`description_ar` text DEFAULT '' NOT NULL,
	`description_en` text DEFAULT '' NOT NULL,
	`type` text NOT NULL,
	`date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text,
	`venue_name_ar` text NOT NULL,
	`venue_name_en` text DEFAULT '' NOT NULL,
	`venue_address` text DEFAULT '' NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`speaker_id` text,
	`livestream_url` text,
	`attendance` text NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `speakers` (
	`id` text PRIMARY KEY,
	`name_ar` text NOT NULL,
	`name_en` text DEFAULT '' NOT NULL,
	`photo_key` text
);
--> statement-breakpoint
CREATE INDEX `gatherings_date` ON `gatherings` (`date`);--> statement-breakpoint
CREATE INDEX `gatherings_speaker` ON `gatherings` (`speaker_id`);