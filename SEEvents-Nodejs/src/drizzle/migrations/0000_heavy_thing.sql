CREATE TABLE `comment_likes` (
	`user_id` varchar(128) NOT NULL,
	`comment_id` int NOT NULL
);
--> statement-breakpoint
CREATE TABLE `communities` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255),
	`contact_email` varchar(255),
	`category` varchar(255),
	`description` varchar(500),
	`icon_url` varchar(500) DEFAULT '',
	CONSTRAINT `communities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_events` (
	`community_id` int,
	`event_id` int NOT NULL
);
--> statement-breakpoint
CREATE TABLE `community_members` (
	`user_id` varchar(128) NOT NULL,
	`community_id` int NOT NULL
);
--> statement-breakpoint
CREATE TABLE `community_moderators` (
	`community_id` int NOT NULL,
	`user_id` varchar(128) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `event_activity` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`event_id` int,
	`type` text NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`comment_id` int,
	`deleted` boolean DEFAULT false,
	`community_id` int,
	CONSTRAINT `event_activity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_announcements` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`event_id` int NOT NULL,
	`text` text NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_comments` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`event_id` int NOT NULL,
	`text` text NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_dislikes` (
	`user_id` varchar(128) NOT NULL,
	`event_id` int NOT NULL
);
--> statement-breakpoint
CREATE TABLE `event_going` (
	`user_id` varchar(128) NOT NULL,
	`event_id` int NOT NULL
);
--> statement-breakpoint
CREATE TABLE `event_interested` (
	`user_id` varchar(128) NOT NULL,
	`event_id` int NOT NULL
);
--> statement-breakpoint
CREATE TABLE `event_likes` (
	`user_id` varchar(128) NOT NULL,
	`event_id` int NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events_table` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`organizer` varchar(255) NOT NULL,
	`attendee_limit` int,
	`location_name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` varchar(255) NOT NULL,
	`start_time` timestamp NOT NULL DEFAULT (now()),
	`end_time` timestamp NOT NULL DEFAULT (now()),
	`locationPointX` float NOT NULL DEFAULT 0,
	`locationPointY` float NOT NULL DEFAULT 0,
	`thumbnailUrl` varchar(255),
	`community_id` int,
	`active` boolean NOT NULL DEFAULT false,
	`deleted` boolean NOT NULL DEFAULT false,
	`organizer_id` varchar(128) NOT NULL,
	CONSTRAINT `events_table_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `friend_connections` (
	`user1_id` varchar(128) NOT NULL,
	`user2_id` varchar(128) NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now())
);
--> statement-breakpoint
CREATE TABLE `friend_requests` (
	`sender_id` varchar(128) NOT NULL,
	`receiver_id` varchar(128) NOT NULL,
	`status` varchar(20) DEFAULT 'pending',
	`timestamp` timestamp NOT NULL DEFAULT (now())
);
--> statement-breakpoint
CREATE TABLE `users_table` (
	`id` varchar(128) NOT NULL,
	`username` varchar(255) NOT NULL,
	`first_name` varchar(255) NOT NULL,
	`last_name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(255) NOT NULL,
	`pfp_url` varchar(500) DEFAULT '',
	CONSTRAINT `users_table_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_table_id_unique` UNIQUE(`id`)
);
