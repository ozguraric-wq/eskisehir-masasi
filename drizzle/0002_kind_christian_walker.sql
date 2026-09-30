CREATE TABLE `cms_media` (
	`id` text PRIMARY KEY NOT NULL,
	`filename` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`alt` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cms_releases` (
	`id` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`data` text NOT NULL,
	`created_at` text NOT NULL,
	`status` text NOT NULL,
	`published_at` text,
	`run_url` text,
	`message` text
);
--> statement-breakpoint
CREATE TABLE `cms_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`data` text NOT NULL,
	`created_at` text NOT NULL,
	`actor` text NOT NULL,
	`label` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cms_state` (
	`id` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`data` text NOT NULL,
	`updated_at` text NOT NULL,
	`actor` text NOT NULL
);
