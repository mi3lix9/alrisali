CREATE TABLE `dhikr_sessions` (
	`id` text PRIMARY KEY,
	`tasbih_id` text NOT NULL,
	`count` integer NOT NULL,
	`completed_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasbih` (
	`id` text PRIMARY KEY,
	`kind` text NOT NULL,
	`name` text,
	`count` integer DEFAULT 0 NOT NULL,
	`step` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `dhikr_sessions_completed_at` ON `dhikr_sessions` (`completed_at`);