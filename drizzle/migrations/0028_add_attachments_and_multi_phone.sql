ALTER TABLE `leads` ADD `phones` text DEFAULT '[]' NOT NULL;
UPDATE `leads` SET `phones` = CASE WHEN `phone` IS NOT NULL AND `phone` != '' THEN json_array(`phone`) ELSE '[]' END;
ALTER TABLE `leads` DROP COLUMN `phone`;
CREATE TABLE `crm_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text,
	`task_id` text,
	`kind` text NOT NULL,
	`url` text NOT NULL,
	`r2_key` text,
	`label` text DEFAULT '' NOT NULL,
	`created_by_user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `crm_attachments_lead_idx` ON `crm_attachments` (`lead_id`);
CREATE INDEX `crm_attachments_task_idx` ON `crm_attachments` (`task_id`);
