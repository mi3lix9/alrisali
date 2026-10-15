CREATE TABLE `quran_reader_settings` (
	`id` text PRIMARY KEY,
	`mode` text DEFAULT 'page' NOT NULL,
	`page_nav` text DEFAULT 'horizontal' NOT NULL,
	`surah_font_size` integer DEFAULT 26 NOT NULL
);
