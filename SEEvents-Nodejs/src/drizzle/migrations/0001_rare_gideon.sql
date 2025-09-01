CREATE TABLE `messages` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`sender_id` varchar(255) NOT NULL,
	`receiver_id` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`timestamp` datetime NOT NULL DEFAULT NOW(),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
