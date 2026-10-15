CREATE TABLE `lesson_slides` (
	`id` text PRIMARY KEY,
	`lesson_id` text NOT NULL,
	`position` integer NOT NULL,
	`image_key` text NOT NULL,
	`caption_ar` text DEFAULT '' NOT NULL,
	`caption_en` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` text PRIMARY KEY,
	`title_ar` text NOT NULL,
	`title_en` text DEFAULT '' NOT NULL,
	`description_ar` text DEFAULT '' NOT NULL,
	`description_en` text DEFAULT '' NOT NULL,
	`category` text NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `lesson_slides_lesson_idx` ON `lesson_slides` (`lesson_id`);