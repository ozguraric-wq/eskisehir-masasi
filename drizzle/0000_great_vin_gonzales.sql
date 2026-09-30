CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`visitor_id` text NOT NULL,
	`name` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_comments_article_date` ON `comments` (`article_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_comments_visitor_date` ON `comments` (`visitor_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `reactions` (
	`article_id` text NOT NULL,
	`visitor_id` text NOT NULL,
	`kind` text NOT NULL,
	PRIMARY KEY(`article_id`, `visitor_id`)
);
