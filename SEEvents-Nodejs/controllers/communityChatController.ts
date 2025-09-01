import { db } from "../src/drizzle/db.ts";
import { eq, and } from 'drizzle-orm';
import { mysqlTable, serial, int, varchar, text, timestamp, boolean } from 'drizzle-orm/mysql-core';
import { eventActivity } from '../src/drizzle/schema.js';

// We need to create a new table for community chat messages
export const communityMessages = mysqlTable("community_messages", {
  id: serial("id").primaryKey(),
  communityId: int("community_id").notNull(),
  senderId: varchar("sender_id", { length: 128 }).notNull(),
  senderName: varchar("sender_name", { length: 255 }).notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  deleted: boolean("deleted").default(false),
});

// Get all messages for a specific community
export const getCommunityMessages = async (req, res) => {
  const { communityId } = req.params;

  try {
    // Verify communityId is valid
    if (!communityId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Community ID is required' 
      });
    }

    // Fetch messages for the community that haven't been deleted
    const messages = await db
      .select()
      .from(communityMessages)
      .where(
        and(
          eq(communityMessages.communityId, parseInt(communityId)),
          eq(communityMessages.deleted, false)
        )
      )
      .orderBy(communityMessages.timestamp);

    return res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching community messages:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch community messages',
      error: error.message
    });
  }
};

// Send a new message to a community chat
export const sendCommunityMessage = async (req, res) => {
  const { communityId, senderId, senderName, message, timestamp } = req.body;

  try {
    // Input validation
    if (!communityId || !senderId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Community ID, sender ID, and message content are required'
      });
    }

    // Handle timestamp properly - use current time if not provided or invalid
    let messageTimestamp;
    try {
      // Try to use the provided timestamp if it's a valid date string
      messageTimestamp = timestamp ? new Date(timestamp) : new Date();
      // Validate that it's actually a date object
      if (!(messageTimestamp instanceof Date) || isNaN(messageTimestamp.getTime())) {
        messageTimestamp = new Date(); // Fallback to current time
      }
    } catch (error) {
      messageTimestamp = new Date(); // Fallback to current time
    }

    // Insert the new message
    const [newMessage] = await db
      .insert(communityMessages)
      .values({
        communityId: parseInt(communityId),
        senderId,
        senderName,
        message,
        timestamp: messageTimestamp,
        deleted: false
      })
      .$returningId();

    return res.status(201).json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    console.error('Error sending community message:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send community message',
      error: error.message
    });
  }
};

// Delete a message from the community chat
export const deleteCommunityMessage = async (req, res) => {
  const { messageId } = req.params;
  const { userId } = req.body; // The user attempting to delete the message

  try {
    // Fetch the message to check ownership
    const [message] = await db
      .select()
      .from(communityMessages)
      .where(eq(communityMessages.id, parseInt(messageId)));

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if the user is the sender of the message
    // In a real app, you might also check if they're a community moderator or admin
    if (message.senderId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this message'
      });
    }

    // Soft delete the message
    await db
      .update(communityMessages)
      .set({ deleted: true })
      .where(eq(communityMessages.id, parseInt(messageId)));

    return res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting community message:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete community message',
      error: error.message
    });
  }
};