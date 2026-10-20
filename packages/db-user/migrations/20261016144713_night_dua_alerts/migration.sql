CREATE TABLE `night_dua_alerts` (
	`id` text PRIMARY KEY,
	`kumayl` integer DEFAULT false NOT NULL,
	`tawassul` integer DEFAULT false NOT NULL,
	`nudba` integer DEFAULT false NOT NULL,
	`ziyarah` integer DEFAULT false NOT NULL
);
