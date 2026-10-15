CREATE TABLE `prayer_logs` (
	`id` text PRIMARY KEY,
	`date` text NOT NULL,
	`salah` text NOT NULL,
	`logged_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `prayer_logs_date_idx` ON `prayer_logs` (`date`);