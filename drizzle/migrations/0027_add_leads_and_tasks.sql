CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`business_name` text DEFAULT '' NOT NULL,
	`contact_name` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_by_user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `leads_created_at_idx` ON `leads` (`created_at`);
CREATE INDEX `leads_status_idx` ON `leads` (`status`);
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`due_at` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`assignee_user_id` text,
	`lead_id` text,
	`created_by_user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`assignee_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `tasks_status_idx` ON `tasks` (`status`);
CREATE INDEX `tasks_assignee_idx` ON `tasks` (`assignee_user_id`);
CREATE INDEX `tasks_lead_idx` ON `tasks` (`lead_id`);
