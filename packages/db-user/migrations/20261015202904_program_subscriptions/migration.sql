CREATE TABLE `program_subscriptions` (
	`id` text PRIMARY KEY,
	`program_kind` text NOT NULL,
	`paused` integer DEFAULT false NOT NULL,
	`subscribed_at` integer NOT NULL
);
