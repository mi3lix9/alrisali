CREATE TABLE `khushu` (
	`id` text PRIMARY KEY,
	`date` text NOT NULL,
	`salah` text NOT NULL,
	`level` integer NOT NULL,
	`distractions` text NOT NULL,
	`custom_distraction` text,
	`rated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `khushu_date_idx` ON `khushu` (`date`);