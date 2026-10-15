CREATE TABLE `believer_settings` (
	`id` text PRIMARY KEY,
	`calculation_method` text DEFAULT 'jafari' NOT NULL,
	`location_latitude` real,
	`location_longitude` real,
	`location_name` text
);
