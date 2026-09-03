CREATE TABLE `calendar_event_attendees` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `calendar_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `calendar_event_attendees_event_idx` ON `calendar_event_attendees` (`event_id`);
CREATE INDEX `calendar_event_attendees_user_idx` ON `calendar_event_attendees` (`user_id`);
ALTER TABLE `calendar_events` DROP COLUMN `attendees`;
