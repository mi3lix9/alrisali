CREATE TABLE `adhans` (
	`id` text PRIMARY KEY,
	`name_ar` text NOT NULL,
	`name_en` text NOT NULL,
	`credit` text DEFAULT '' NOT NULL,
	`full_key` text NOT NULL,
	`full_seconds` real NOT NULL,
	`full_bytes` integer NOT NULL,
	`takbir_key` text NOT NULL,
	`takbir_seconds` real NOT NULL,
	`takbir_bytes` integer NOT NULL,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `adhans_position` ON `adhans` (`position`);