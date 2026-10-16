CREATE TABLE `amal_entries` (
	`month` integer NOT NULL,
	`day` integer NOT NULL,
	`kind` text NOT NULL,
	`time` text DEFAULT '' NOT NULL,
	`supplication_id` text NOT NULL,
	CONSTRAINT `amal_entries_pk` PRIMARY KEY(`month`, `day`, `time`, `supplication_id`)
);
--> statement-breakpoint
INSERT OR IGNORE INTO `amal_entries` (`month`, `day`, `kind`, `time`, `supplication_id`) VALUES (1, 1, 'dua', 'night', 'sahifa-43'), (2, 1, 'dua', 'night', 'sahifa-43'), (3, 1, 'dua', 'night', 'sahifa-43'), (4, 1, 'dua', 'night', 'sahifa-43'), (5, 1, 'dua', 'night', 'sahifa-43'), (6, 1, 'dua', 'night', 'sahifa-43'), (7, 1, 'dua', 'night', 'sahifa-43'), (8, 1, 'dua', 'night', 'sahifa-43'), (9, 1, 'dua', 'night', 'sahifa-43'), (10, 1, 'dua', 'night', 'sahifa-43'), (11, 1, 'dua', 'night', 'sahifa-43'), (12, 1, 'dua', 'night', 'sahifa-43'), (1, 10, 'ziyarah', '', 'mafatih-ziyarat-ashura'), (2, 20, 'ziyarah', '', 'mafatih-ziyarat-arbaeen'), (8, 15, 'dua', 'night', 'mafatih-dua-kumayl'), (9, 0, 'dua', 'night', 'mafatih-dua-iftitah'), (9, 1, 'dua', '', 'sahifa-44'), (10, 1, 'dua', '', 'sahifa-46'), (10, 1, 'dua', '', 'mafatih-dua-nudba'), (12, 9, 'dua', 'day', 'sahifa-47'), (12, 10, 'dua', '', 'sahifa-48'), (12, 10, 'dua', '', 'mafatih-dua-nudba'), (12, 18, 'dua', '', 'mafatih-dua-nudba');
