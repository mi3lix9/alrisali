CREATE TABLE `khatmah_logs` (
	`id` text PRIMARY KEY,
	`khatmah_id` text NOT NULL,
	`session` integer NOT NULL,
	`date` text NOT NULL,
	`completed_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `khatmahs` (
	`id` text PRIMARY KEY,
	`plan` text NOT NULL,
	`start_date` text NOT NULL,
	`reminder_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quran_bookmark_ribbons` (
	`color` text PRIMARY KEY,
	`name` text,
	`ayah` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE INDEX `khatmah_logs_khatmah_id_idx` ON `khatmah_logs` (`khatmah_id`);