CREATE TABLE `analytics_event` (
	`id` text PRIMARY KEY,
	`install_id` text NOT NULL,
	`user_id` text,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`data` text,
	`occurred_at` integer NOT NULL,
	`received_at` integer NOT NULL,
	CONSTRAINT `fk_analytics_event_install_id_analytics_install_install_id_fk` FOREIGN KEY (`install_id`) REFERENCES `analytics_install`(`install_id`) ON DELETE CASCADE,
	CONSTRAINT `fk_analytics_event_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `analytics_install` (
	`install_id` text PRIMARY KEY,
	`user_id` text,
	`platform` text NOT NULL,
	`os_version` text NOT NULL,
	`app_version` text NOT NULL,
	`device_type` text NOT NULL,
	`birth_year` integer,
	`first_seen_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	CONSTRAINT `fk_analytics_install_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX `analytics_event_occurred_idx` ON `analytics_event` (`occurred_at`);--> statement-breakpoint
CREATE INDEX `analytics_event_type_idx` ON `analytics_event` (`type`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `analytics_event_install_idx` ON `analytics_event` (`install_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `analytics_install_first_seen_idx` ON `analytics_install` (`first_seen_at`);--> statement-breakpoint
CREATE INDEX `analytics_install_last_seen_idx` ON `analytics_install` (`last_seen_at`);