CREATE TABLE `announcement_delivery` (
	`announcement_id` text NOT NULL,
	`device_id` text NOT NULL,
	`language` text NOT NULL,
	`sent_at` integer NOT NULL,
	`ticket_id` text,
	CONSTRAINT `announcement_delivery_pk` PRIMARY KEY(`announcement_id`, `device_id`),
	CONSTRAINT `fk_announcement_delivery_device_id_push_device_id_fk` FOREIGN KEY (`device_id`) REFERENCES `push_device`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `push_device` (
	`id` text PRIMARY KEY,
	`token` text NOT NULL UNIQUE,
	`user_id` text,
	`platform` text NOT NULL,
	`language` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`last_seen_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_push_device_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX `announcement_delivery_device_id_idx` ON `announcement_delivery` (`device_id`);--> statement-breakpoint
CREATE INDEX `announcement_delivery_ticket_id_idx` ON `announcement_delivery` (`ticket_id`);--> statement-breakpoint
CREATE INDEX `push_device_user_id_idx` ON `push_device` (`user_id`);