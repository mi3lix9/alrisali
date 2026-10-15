CREATE TABLE `library_assets` (
	`id` text PRIMARY KEY,
	`title_ar` text NOT NULL,
	`title_en` text DEFAULT '' NOT NULL,
	`author_ar` text DEFAULT '' NOT NULL,
	`author_en` text DEFAULT '' NOT NULL,
	`description_ar` text DEFAULT '' NOT NULL,
	`description_en` text DEFAULT '' NOT NULL,
	`category` text NOT NULL,
	`kind` text NOT NULL,
	`file_key` text NOT NULL,
	`file_size` integer NOT NULL,
	`cover_key` text,
	`display_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `library_assets_category` ON `library_assets` (`category`);