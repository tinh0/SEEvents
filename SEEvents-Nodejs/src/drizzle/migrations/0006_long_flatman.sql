CREATE TABLE `community_messages` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`community_id` int NOT NULL,
	`sender_id` varchar(128) NOT NULL,
	`sender_name` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`deleted` boolean DEFAULT false,
	CONSTRAINT `community_messages_id` PRIMARY KEY(`id`)
);
