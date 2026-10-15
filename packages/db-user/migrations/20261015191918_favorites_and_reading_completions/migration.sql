CREATE TABLE `favorites` (
	`id` text PRIMARY KEY,
	`kind` text NOT NULL,
	`key` text NOT NULL,
	`favorited_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reading_completions` (
	`id` text PRIMARY KEY,
	`supplication_id` text NOT NULL,
	`date` text NOT NULL,
	`completed_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `favorites_favorited_at` ON `favorites` (`favorited_at`);--> statement-breakpoint
CREATE INDEX `reading_completions_date` ON `reading_completions` (`date`);