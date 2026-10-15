CREATE TABLE `announcement` (
	`id` text PRIMARY KEY,
	`title_ar` text DEFAULT '' NOT NULL,
	`body_ar` text DEFAULT '' NOT NULL,
	`title_en` text DEFAULT '' NOT NULL,
	`body_en` text DEFAULT '' NOT NULL,
	`audience` text DEFAULT 'all' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`scheduled_at` integer,
	`sent_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
