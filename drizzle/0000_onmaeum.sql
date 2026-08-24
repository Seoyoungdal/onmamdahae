CREATE TABLE `users` (`id` text PRIMARY KEY NOT NULL,`email` text NOT NULL,`name` text NOT NULL,`role` text DEFAULT 'member' NOT NULL,`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL);
--> statement-breakpoint
CREATE TABLE `services` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,`title` text NOT NULL,`service_date` text NOT NULL,`service_time` text NOT NULL,`location` text DEFAULT '본당' NOT NULL,`leader_id` text,`leader_name` text,`created_by` text NOT NULL,`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL);
--> statement-breakpoint
CREATE TABLE `assignments` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,`service_id` integer NOT NULL,`part` text NOT NULL,`member_name` text NOT NULL,`sort_order` integer DEFAULT 0 NOT NULL);
--> statement-breakpoint
CREATE INDEX `idx_assignments_service` ON `assignments` (`service_id`,`sort_order`);
--> statement-breakpoint
CREATE TABLE `songs` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,`service_id` integer NOT NULL,`title` text NOT NULL,`artist` text DEFAULT '' NOT NULL,`song_key` text DEFAULT '' NOT NULL,`bpm` integer DEFAULT 0 NOT NULL,`reference_url` text DEFAULT '' NOT NULL,`leader_note` text DEFAULT '' NOT NULL,`sort_order` integer DEFAULT 0 NOT NULL,`version` integer DEFAULT 1 NOT NULL,`original_key` text NOT NULL,`original_name` text NOT NULL,`annotated_key` text,`annotated_name` text,`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL);
--> statement-breakpoint
CREATE INDEX `idx_songs_service_order` ON `songs` (`service_id`,`sort_order`);
--> statement-breakpoint
PRAGMA optimize;
