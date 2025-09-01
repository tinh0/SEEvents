import { relations, sql } from "drizzle-orm";
import {
  date,
  datetime,
  int,
  mysqlTable,
  serial,
  timestamp,
  varchar,
  text,
  float,
  boolean,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const events = mysqlTable("events_table", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  organizer: varchar("organizer", { length: 255 }).notNull(),
  attendeeLimit: int("attendee_limit"),
  locationName: varchar("location_name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time").defaultNow().notNull(),
  locationPointX: float("locationPointX").notNull().default(0),
  locationPointY: float("locationPointY").notNull().default(0),
  thumbnailUrl: varchar("thumbnailUrl", { length: 255 }),
  communityId: int("community_id"),
  active: boolean("active").notNull().default(false),
  deleted: boolean("deleted").notNull().default(false),
  organizerId: varchar("organizer_id", { length: 128 }).notNull(),
  links: varchar("links", { length: 2048 }),
  communityOnly: boolean("community_only").notNull().default(false)
});

export const users = mysqlTable("users_table", {
  id: varchar("id", { length: 128 }).primaryKey().unique().notNull(),
  username: varchar("username", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  pfpUrl: varchar("pfp_url", { length: 500 }).default(""),
  fcmToken: varchar("fcm_token", { length: 500 }).default(""),
});

export const notificationPreferences = mysqlTable(
  "user_notification_preferences",
  {
    id: varchar("id", { length: 128 }).primaryKey().notNull(),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id),
    filterType: varchar("filter_type", { length: 255 }).notNull(),
  },
  (table) => {
    return {
      // Use the updated way to define a unique composite constraint
      userFilterIdx: uniqueIndex("user_filter_idx").on(
        table.userId,
        table.filterType
      ),
    };
  }
);

export const communities = mysqlTable("communities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  category: varchar("category", { length: 255 }),
  description: varchar("description", { length: 500 }),
  iconUrl: varchar("icon_url", { length: 500 }).default(""),
  closed: boolean("closed").notNull().default(false)
});

// Junction table for moderators (many-to-many relation with users)
export const communityModerators = mysqlTable("community_moderators", {
  communityId: int("community_id").notNull(), //.references(() => communities.id),
  userId: varchar("user_id", { length: 128 }).notNull(),
  //.references(() => users.id),
});

// Junction table for events (many-to-many relation with events)
export const communityEvents = mysqlTable("community_events", {
  communityId: int("community_id"), //.references(() => communities.id),
  eventId: int("event_id").notNull(),
  //.references(() => events.id),
});

// Junction table for community membership (many-to-many relation with events)
export const communityMembers = mysqlTable("community_members", {
  userId: varchar("user_id", { length: 128 }).notNull(),
  //.references(() => users.id),
  communityId: int("community_id").notNull(), //.references(() => communities.id),
});

export const communityRequests = mysqlTable("community_requests", {
  userId: varchar("user_id", { length: 128 }).notNull(),
  //.references(() => users.id),
  communityId: int("community_id").notNull(), //.references(() => communities.id),
});

export const eventInterested = mysqlTable("event_interested", {
  userId: varchar("user_id", { length: 128 }).notNull(),
  //.references(() => users.id),
  eventId: int("event_id").notNull(),
});

export const eventGoing = mysqlTable("event_going", {
  userId: varchar("user_id", { length: 128 }).notNull(),
  //.references(() => users.id),
  eventId: int("event_id").notNull(),
});

export const eventLikes = mysqlTable("event_likes", {
  userId: varchar("user_id", { length: 128 }).notNull(),
  //.references(() => users.id),
  eventId: int("event_id").notNull(),
});

export const eventDislikes = mysqlTable("event_dislikes", {
  userId: varchar("user_id", { length: 128 }).notNull(),
  //.references(() => users.id),
  eventId: int("event_id").notNull(),
});

export const eventComments = mysqlTable("event_comments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 128 }).notNull(),
  //.references(() => users.id),
  eventId: int("event_id").notNull(),
  text: text("text").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  imageUrl: varchar("imageUrl", { length: 255 }).default(""),
  deleted: boolean("deleted").default(false),
});

export const commentLikes = mysqlTable("comment_likes", {
  userId: varchar("user_id", { length: 128 }).notNull(),
  //.references(() => users.id),
  commentId: int("comment_id").notNull(),
});

export const eventAnnouncements = mysqlTable("event_announcements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 128 }).notNull(),
  //.references(() => users.id),
  eventId: int("event_id").notNull(),
  text: text("text").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const friendRequests = mysqlTable("friend_requests", {
  senderId: varchar("sender_id", { length: 128 }).notNull(),
  receiverId: varchar("receiver_id", { length: 128 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'accepted', 'rejected'
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const friendConnections = mysqlTable("friend_connections", {
  user1Id: varchar("user1_id", { length: 128 }).notNull(),
  user2Id: varchar("user2_id", { length: 128 }).notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const eventActivity = mysqlTable("event_activity", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 128 }).notNull(),
  eventId: int("event_id"),
  type: text("type").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  commentId: int("comment_id"),
  deleted: boolean("deleted").default(false),
  communityId: int("community_id"),
});

export const messages = mysqlTable("messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id", { length: 255 }).notNull(),
  receiverId: varchar("receiver_id", { length: 255 }).notNull(),
  message: text("message").notNull(),
  timestamp: datetime("timestamp")
    .default(sql`NOW()`)
    .notNull(),
});

export const communityMessages = mysqlTable("community_messages", {
  id: serial("id").primaryKey(),
  communityId: int("community_id").notNull(),
  senderId: varchar("sender_id", { length: 128 }).notNull(),
  senderName: varchar("sender_name", { length: 255 }).notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  deleted: boolean("deleted").default(false),
});
