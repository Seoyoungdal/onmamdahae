ALTER TABLE `services` ADD `playlist_url` text DEFAULT '' NOT NULL;
--> statement-breakpoint
PRAGMA optimize;
