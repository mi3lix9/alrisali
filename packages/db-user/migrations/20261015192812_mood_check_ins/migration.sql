CREATE TABLE `mood_check_ins` (
	`id` text PRIMARY KEY,
	`mood` text NOT NULL,
	`remedy_id` text NOT NULL,
	`checked_in_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `mood_check_ins_checked_in_at_idx` ON `mood_check_ins` (`checked_in_at`);