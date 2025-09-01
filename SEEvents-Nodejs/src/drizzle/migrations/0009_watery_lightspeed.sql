ALTER TABLE `communities` ADD `closed` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `events_table` ADD `community_only` boolean DEFAULT false NOT NULL;