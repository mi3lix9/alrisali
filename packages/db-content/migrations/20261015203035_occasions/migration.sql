CREATE TABLE `occasions` (
	`id` text PRIMARY KEY,
	`month` integer NOT NULL,
	`day` integer NOT NULL,
	`type` text NOT NULL,
	`name_ar` text NOT NULL,
	`name_en` text NOT NULL,
	`created_at` integer NOT NULL
);
