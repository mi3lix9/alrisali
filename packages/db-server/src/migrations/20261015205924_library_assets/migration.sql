CREATE TABLE `library_asset` (
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
	`display_order` integer DEFAULT 0 NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
