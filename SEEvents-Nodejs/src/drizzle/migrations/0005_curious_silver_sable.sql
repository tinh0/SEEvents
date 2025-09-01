CREATE TABLE `user_notification_preferences` (
	`id` varchar(128) NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`filter_type` varchar(255) NOT NULL,
	CONSTRAINT `user_notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_filter_idx` UNIQUE(`user_id`,`filter_type`)
);
--> statement-breakpoint
ALTER TABLE `user_notification_preferences` ADD CONSTRAINT `user_notification_preferences_user_id_users_table_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users_table`(`id`) ON DELETE no action ON UPDATE no action;