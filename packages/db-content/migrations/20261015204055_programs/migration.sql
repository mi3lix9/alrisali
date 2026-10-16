CREATE TABLE `program_acts` (
	`id` text PRIMARY KEY,
	`program_id` text NOT NULL,
	`position` integer NOT NULL,
	`name_ar` text NOT NULL,
	`name_en` text NOT NULL,
	`description_ar` text DEFAULT '' NOT NULL,
	`description_en` text DEFAULT '' NOT NULL,
	`schedule` text NOT NULL,
	`salah` text,
	`detail` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `programs` (
	`id` text PRIMARY KEY,
	`category` text NOT NULL,
	`name_ar` text NOT NULL,
	`name_en` text NOT NULL,
	`description_ar` text DEFAULT '' NOT NULL,
	`description_en` text DEFAULT '' NOT NULL,
	`window_start_month` integer,
	`window_start_day` integer,
	`window_end_month` integer,
	`window_end_day` integer,
	`active` integer DEFAULT true NOT NULL,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `program_acts_program_idx` ON `program_acts` (`program_id`);