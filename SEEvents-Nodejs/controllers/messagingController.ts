import { db } from "../src/drizzle/db.ts";
import { messages, friendConnections } from "../src/drizzle/schema.ts";
import { eq, or, and, desc, asc } from "drizzle-orm";

// Send a message
// Send a message
export const sendMessage = async (req, res, next) => {
    const { senderId, receiverId, message } = req.body;
  
    try {
      if (!senderId || !receiverId || !message) {
        return res.status(400).json({ message: "All fields are required." });
      }
  
      // Check if users are friends before sending a message
      const isFriend = await db
        .select()
        .from(friendConnections)
        .where(
          or(
            and(eq(friendConnections.user1Id, senderId), eq(friendConnections.user2Id, receiverId)),
            and(eq(friendConnections.user1Id, receiverId), eq(friendConnections.user2Id, senderId))
          )
        )
        .limit(1);
  
      if (isFriend.length === 0) {
        return res.status(403).json({ message: "You can only message your friends." });
      }
  
      // Send the message
      await db.insert(messages).values({
        senderId,
        receiverId,
        message,
      });
  
      res.status(200).json({ message: "Message sent successfully." });
    } catch (error) {
      console.error(error);
      return next(error);
    }
  };
  

// Get chat history between two users
export const getChatHistory = async (req, res, next) => {
    const { userId, friendId } = req.params;
  
    try {
      // Check if users are friends before fetching chat history
      const isFriend = await db
        .select()
        .from(friendConnections)
        .where(
          or(
            and(eq(friendConnections.user1Id, userId), eq(friendConnections.user2Id, friendId)),
            and(eq(friendConnections.user1Id, friendId), eq(friendConnections.user2Id, userId))
          )
        )
        .limit(1);
  
      if (isFriend.length === 0) {
        return res.status(403).json({ message: "You can only view chat history with your friends." });
      }
  
      // Fetch the chat history between the two users
      const chatHistory = await db
        .select()
        .from(messages)
        .where(
          or(
            and(eq(messages.senderId, userId), eq(messages.receiverId, friendId)),
            and(eq(messages.senderId, friendId), eq(messages.receiverId, userId))
          )
        )
        .orderBy(asc(messages.timestamp));
  
      res.status(200).json({ messages: chatHistory });
    } catch (error) {
      console.error(error);
      return next(error);
    }
  };
  