CREATE TABLE `reminder_settings` (
	`id` text PRIMARY KEY,
	`salah_rules` text,
	`imsak_rule` text,
	`quiet_hours_enabled` integer,
	`quiet_hours_start` integer,
	`quiet_hours_end` integer
);
--> statement-breakpoint
ALTER TABLE `believer_settings` ADD `message_style` text;