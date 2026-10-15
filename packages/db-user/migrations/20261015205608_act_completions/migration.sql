CREATE TABLE `act_completions` (
	`id` text PRIMARY KEY,
	`program_id` text NOT NULL,
	`act_id` text NOT NULL,
	`date` text NOT NULL,
	`completed_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `seen_programs` (
	`id` text PRIMARY KEY,
	`seen_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `act_completions_date_idx` ON `act_completions` (`date`);