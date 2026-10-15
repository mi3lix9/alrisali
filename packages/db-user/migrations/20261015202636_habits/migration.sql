CREATE TABLE `habit_completions` (
	`id` text PRIMARY KEY,
	`habit_id` text NOT NULL,
	`date` text NOT NULL,
	`completed_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `habit_seeds` (
	`id` text PRIMARY KEY,
	`seeded_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `habits` (
	`id` text PRIMARY KEY,
	`name` text,
	`preset` text,
	`schedule` text NOT NULL,
	`reminder_at` integer,
	`archived_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `habit_completions_habit_id_idx` ON `habit_completions` (`habit_id`);--> statement-breakpoint
CREATE INDEX `habit_completions_date_idx` ON `habit_completions` (`date`);