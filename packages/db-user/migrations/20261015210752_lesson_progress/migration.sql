CREATE TABLE `lesson_progress` (
	`lesson_id` text PRIMARY KEY,
	`current_slide` integer NOT NULL,
	`furthest_slide` integer NOT NULL,
	`completed_at` integer,
	`updated_at` integer NOT NULL
);
