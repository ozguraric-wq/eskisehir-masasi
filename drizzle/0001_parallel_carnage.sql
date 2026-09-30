CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_messages_visitor_date` ON `messages` (`visitor_id`,`created_at`);