CREATE TABLE `worship_mapping` (
	`kind` text NOT NULL,
	`day` text NOT NULL,
	`supplication_id` text NOT NULL,
	CONSTRAINT `worship_mapping_pk` PRIMARY KEY(`kind`, `day`, `supplication_id`)
);
--> statement-breakpoint
INSERT OR IGNORE INTO `daily_content` (`weekday`, `supplication_id`) VALUES ('saturday', 'sahifa-weekday-saturday'), ('sunday', 'sahifa-weekday-sunday'), ('monday', 'sahifa-weekday-monday'), ('tuesday', 'sahifa-weekday-tuesday'), ('wednesday', 'sahifa-weekday-wednesday'), ('thursday', 'sahifa-weekday-thursday'), ('friday', 'sahifa-weekday-friday');
--> statement-breakpoint
INSERT OR IGNORE INTO `worship_mapping` (`kind`, `day`, `supplication_id`) VALUES ('night-dua', 'thursday', 'mafatih-dua-kumayl'), ('every-day', 'every', 'mafatih-dua-sabah');
