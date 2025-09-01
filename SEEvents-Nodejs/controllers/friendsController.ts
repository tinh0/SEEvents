import { db } from "../src/drizzle/db.ts";
import { friendRequests, friendConnections, users } from "../src/drizzle/schema.ts"; // Ensure users table is imported
import { eq, and, or, sql } from "drizzle-orm";

// Send a friend request from one user to another
export const sendFriendRequest = async (req, res, next) => {
  const { senderId, receiverEmail } = req.body;

  try {
    // Ensure sender and receiver are different
    if (!receiverEmail) {
      return res.status(400).json({ message: "Receiver email is required." });
    }

    // Get the receiver's user ID from the email
    const receiver = await db
      .select()
      .from(users) // Assuming 'users' table holds user details including email
      .where(eq(users.email, receiverEmail))
      .limit(1);

      if (receiver.length === 0) {
        return res.status(404).json({ 
          message: "No user found with this email address. Please check the email and try again." 
        });
      }

    const receiver_id = receiver[0].id; // Assuming user ID is in 'id' field

    // Check if sender is trying to send a request to themselves
    if (senderId === receiver_id) {
      return res.status(400).json({ message: "Cannot send a friend request to yourself." });
    }

    // Check if there's already a pending request
    const existingRequest = await db
      .select()
      .from(friendRequests)
      .where(and(
        eq(friendRequests.senderId, senderId),
        eq(friendRequests.receiverId, receiver_id),
        eq(friendRequests.status, 'pending')
      ))
      .limit(1);

    if (existingRequest.length > 0) {
      return res.status(400).json({ message: "Friend request already sent." });
    }

    // Create a new friend request
    await db.insert(friendRequests).values({
      senderId: senderId,
      receiverId: receiver_id,
      status: 'pending',
    });

    res.status(200).json({ message: "Friend request sent." });
  } catch (error) {
    console.error(error);
    return next(error); // Use next() for error handling as per the other controller style
  }
};

// Deny a friend request
export const denyFriendRequest = async (req, res, next) => {
  const { sender_id, receiver_id } = req.body;

  try {
    // Find the pending friend request
    const request = await db
      .select()
      .from(friendRequests)
      .where(and(
        eq(friendRequests.senderId, sender_id),
        eq(friendRequests.receiverId, receiver_id),
        eq(friendRequests.status, 'pending')
      ))
      .limit(1);

    if (request.length === 0) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    // Delete the pending friend request
    await db
      .delete(friendRequests)
      .where(and(
        eq(friendRequests.senderId, sender_id),
        eq(friendRequests.receiverId, receiver_id)
      ));

    res.status(200).json({ message: "Friend request denied and removed." });
  } catch (error) {
    console.error(error);
    return next(error);
  }
};

// Accept a friend request
export const acceptFriendRequest = async (req, res, next) => {
  const { sender_id, receiver_id } = req.body;

  try {
    // Find the pending friend request
    const request = await db
      .select()
      .from(friendRequests)
      .where(and(
        eq(friendRequests.senderId, sender_id),
        eq(friendRequests.receiverId, receiver_id),
        eq(friendRequests.status, 'pending')
      ))
      .limit(1);

    if (request.length === 0) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    // Delete the pending friend request
    await db
      .delete(friendRequests)
      .where(and(
        eq(friendRequests.senderId, sender_id),
        eq(friendRequests.receiverId, receiver_id)
      ));

    // Create a new friend connection
    await db.insert(friendConnections).values({
      user1Id: sender_id,
      user2Id: receiver_id,
    });

    res.status(200).json({ message: "Friend request accepted, users are now friends." });
  } catch (error) {
    console.error(error);
    return next(error);
  }
};


export const unfriendConnection = async (req, res, next) => {
  const { friendId, userId } = req.body;

  try {
    // Find the existing friend connection in both possible orderings
    const connection = await db
      .select()
      .from(friendConnections)
      .where(
        or(
          and(eq(friendConnections.user1Id, userId), eq(friendConnections.user2Id, friendId)),
          and(eq(friendConnections.user1Id, friendId), eq(friendConnections.user2Id, userId))
        )
      )
      .limit(1);

    if (connection.length === 0) {
      return res.status(404).json({ message: "Friend connection not found." });
    }

    // Delete the friend connection considering both orderings
    await db
      .delete(friendConnections)
      .where(
        or(
          and(eq(friendConnections.user1Id, userId), eq(friendConnections.user2Id, friendId)),
          and(eq(friendConnections.user1Id, friendId), eq(friendConnections.user2Id, userId))
        )
      );

    res.status(200).json({ message: "Users are no longer friends." });
  } catch (error) {
    console.error(error);
    return next(error);
  }
};


export const getIncomingFriendRequests = async (req, res, next) => {
  const { user_id } = req.params;

  try {
    // Fetch all incoming (pending) friend requests for the user with both name and username
    const incomingRequests = await db
      .select({
        // Add a unique identifier for each request
        id: sql`CONCAT(${friendRequests.senderId}, '-', ${friendRequests.receiverId})`, // Create a unique ID
        senderId: friendRequests.senderId,
        receiverId: friendRequests.receiverId,
        status: friendRequests.status,
        senderName: sql`concat(${users.firstName}, ' ', ${users.lastName})`, // Combine first and last name
        senderUsername: users.username, // Add the username separately
      })
      .from(friendRequests)
      .innerJoin(users, eq(friendRequests.senderId, users.id))
      .where(
        and(
          eq(friendRequests.receiverId, user_id),
          eq(friendRequests.status, 'pending')
        )
      );

    // Return incoming requests with sender information
    res.status(200).json({ incomingRequests: incomingRequests.length > 0 ? incomingRequests : [] });
  } catch (error) {
    console.error(error);
    return next(error);
  }
};


export const getCurrentFriends = async (req, res, next) => {
  const { user_id } = req.params;

  try {
    const currentFriends = await db
      .select({
        friendId: sql`CASE 
          WHEN ${friendConnections.user1Id} = ${user_id} THEN ${friendConnections.user2Id} 
          ELSE ${friendConnections.user1Id} 
        END`.as("friendId"),
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName
      })
      .from(friendConnections)
      .innerJoin(
        users,
        eq(
          users.id,
          sql`CASE 
            WHEN ${friendConnections.user1Id} = ${user_id} THEN ${friendConnections.user2Id} 
            ELSE ${friendConnections.user1Id} 
          END`
        )
      )
      .where(
        or(
          eq(friendConnections.user1Id, user_id),
          eq(friendConnections.user2Id, user_id)
        )
      );

    res.status(200).json({
      friends: currentFriends.map((connection) => ({
        id: connection.friendId,
        username: connection.username,
        firstName: connection.firstName,
        lastName: connection.lastName,
      })),
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
};
