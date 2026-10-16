CREATE TABLE `qada_logs` (
	`id` text PRIMARY KEY,
	`date` text NOT NULL,
	`kind` text NOT NULL,
	`salah` text,
	`logged_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `qada_plan` (
	`id` text PRIMARY KEY,
	`fajr` integer DEFAULT 0 NOT NULL,
	`dhuhr` integer DEFAULT 0 NOT NULL,
	`asr` integer DEFAULT 0 NOT NULL,
	`maghrib` integer DEFAULT 0 NOT NULL,
	`isha` integer DEFAULT 0 NOT NULL,
	`fasts` integer DEFAULT 0 NOT NULL,
	`salah_per_day` integer DEFAULT 5 NOT NULL,
	`fasts_per_week` integer DEFAULT 2 NOT NULL,
	`reminder_enabled` integer DEFAULT false NOT NULL,
	`reminder_at` integer DEFAULT 1260 NOT NULL,
	`reminder_weekdays` text DEFAULT '[1,2,3,4,5,6,7]' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `qada_logs_date_idx` ON `qada_logs` (`date`);