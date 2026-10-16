CREATE TABLE `contact_message` (
	`id` text PRIMARY KEY,
	`user_id` text,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`ip_hash` text NOT NULL,
	`user_agent` text,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_contact_message_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `contact_message_ip_hash_created_at_idx` ON `contact_message` (`ip_hash`,`created_at`);--> statement-breakpoint
CREATE INDEX `contact_message_status_idx` ON `contact_message` (`status`);--> statement-breakpoint
CREATE INDEX `contact_message_created_at_idx` ON `contact_message` (`created_at`);