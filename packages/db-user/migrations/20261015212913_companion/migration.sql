CREATE TABLE `companion` (
	`id` text PRIMARY KEY,
	`theme` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `companion_xp_awards` (
	`id` text PRIMARY KEY,
	`kind` text NOT NULL,
	`xp` integer NOT NULL,
	`awarded_at` integer NOT NULL
);
