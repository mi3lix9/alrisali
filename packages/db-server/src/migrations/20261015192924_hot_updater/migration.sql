CREATE TABLE `api_keys` (
	`id` TEXT PRIMARY KEY NOT NULL,
	`hash` TEXT NOT NULL,
	`name` TEXT NOT NULL,
	`prefix` TEXT NOT NULL,
	`role` TEXT NOT NULL,
	`created_at_ms` INTEGER NOT NULL,
	`revoked_at_ms` INTEGER,
	`_v` INTEGER DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bundle_patches` (
	`id` TEXT PRIMARY KEY NOT NULL,
	`bundle_id` TEXT NOT NULL,
	`base_bundle_id` TEXT NOT NULL,
	`base_file_hash` TEXT NOT NULL,
	`patch_file_hash` TEXT NOT NULL,
	`patch_storage_uri` TEXT NOT NULL,
	`byte_size` INTEGER NOT NULL,
	`order_index` INTEGER NOT NULL,
	`_v` INTEGER DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bundle_totals` (
	`platform_key` TEXT NOT NULL,
	`_shard` INTEGER NOT NULL,
	`bundles` INTEGER NOT NULL,
	`_v` INTEGER DEFAULT 0 NOT NULL,
	CONSTRAINT `bundle_totals_pk` PRIMARY KEY(`platform_key`, `_shard`)
);
--> statement-breakpoint
CREATE TABLE `bundles` (
	`id` TEXT PRIMARY KEY NOT NULL,
	`platform` TEXT NOT NULL,
	`git_commit_hash` TEXT,
	`metadata` TEXT NOT NULL,
	`manifest_storage_uri` TEXT NOT NULL,
	`manifest_file_hash` TEXT NOT NULL,
	`asset_base_storage_uri` TEXT NOT NULL,
	`_refs_bundle_patches_bundle_id` INTEGER DEFAULT 0 NOT NULL,
	`_refs_bundle_patches_base_bundle_id` INTEGER DEFAULT 0 NOT NULL,
	`_refs_releases_bundle_id` INTEGER DEFAULT 0 NOT NULL,
	`_v` INTEGER DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `channels` (
	`id` TEXT PRIMARY KEY NOT NULL,
	`name` TEXT NOT NULL,
	`_refs_releases_channel_id` INTEGER DEFAULT 0 NOT NULL,
	`_v` INTEGER DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `private_hot_updater_settings` (
	`key` TEXT PRIMARY KEY NOT NULL,
	`value` TEXT NOT NULL,
	`_v` INTEGER DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `release_catalogs` (
	`scope_key` TEXT PRIMARY KEY NOT NULL,
	`catalog_id` TEXT NOT NULL,
	`strategy` TEXT NOT NULL,
	`channel_id` TEXT NOT NULL,
	`channel_key` TEXT NOT NULL,
	`platform` TEXT NOT NULL,
	`fingerprint_hash` TEXT,
	`generation` INTEGER NOT NULL,
	`payload` TEXT NOT NULL,
	`catalog_hash` TEXT NOT NULL,
	`byte_size` INTEGER NOT NULL,
	`is_tombstone` INTEGER NOT NULL,
	`updated_at_ms` INTEGER NOT NULL,
	`_v` INTEGER DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `releases` (
	`id` TEXT PRIMARY KEY NOT NULL,
	`revision` INTEGER NOT NULL,
	`scope_key` TEXT NOT NULL,
	`channel_id` TEXT NOT NULL,
	`platform` TEXT NOT NULL,
	`kind` TEXT NOT NULL,
	`bundle_id` TEXT,
	`strategy` TEXT NOT NULL,
	`target_app_version` TEXT,
	`fingerprint_hash` TEXT,
	`enabled` INTEGER NOT NULL,
	`should_force_update` INTEGER NOT NULL,
	`message` TEXT,
	`rollout_cohort_count` INTEGER NOT NULL,
	`target_cohorts` TEXT NOT NULL,
	`operation` TEXT NOT NULL,
	`source_release_id` TEXT,
	`created_at_ms` INTEGER NOT NULL,
	`updated_at_ms` INTEGER NOT NULL,
	`_v` INTEGER DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `api_keys_byCreated` ON `api_keys` (`created_at_ms`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_hash` ON `api_keys` (`hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `bundle_patches_pair` ON `bundle_patches` (`bundle_id`,`base_bundle_id`);--> statement-breakpoint
CREATE INDEX `bundle_patches_byBundle` ON `bundle_patches` (`bundle_id`,`order_index`,`id`);--> statement-breakpoint
CREATE INDEX `bundle_patches_byBase` ON `bundle_patches` (`base_bundle_id`,`bundle_id`,`id`);--> statement-breakpoint
CREATE INDEX `bundles_byPlatform` ON `bundles` (`platform`,`id`);--> statement-breakpoint
CREATE INDEX `channels_all` ON `channels` (`name`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `channels_name` ON `channels` (`name`);--> statement-breakpoint
CREATE INDEX `releases_byScope` ON `releases` (`scope_key`,`id`);--> statement-breakpoint
CREATE INDEX `releases_byScopeEnabled` ON `releases` (`scope_key`,`enabled`,`id`);--> statement-breakpoint
CREATE INDEX `releases_byChannelPlatform` ON `releases` (`channel_id`,`platform`,`id`);--> statement-breakpoint
CREATE INDEX `releases_byChannelPlatformEnabled` ON `releases` (`channel_id`,`platform`,`enabled`,`id`);--> statement-breakpoint
CREATE INDEX `releases_byBundle` ON `releases` (`bundle_id`,`id`);