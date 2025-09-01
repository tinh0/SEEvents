// src/controllers/moderatorController.js
import { db } from "../src/drizzle/db.ts";
import { communityModerators } from "../src/drizzle/schema.ts";
import { users } from "../src/drizzle/schema.ts";
import { eq, SQL, sql } from "drizzle-orm"

export const addModerator = async (req, res, next) => {
    const { communityId, userId } = req.body;

    // Validate input
    if (!communityId || !userId) {
        return res.status(400).json({ error: 'Community ID and User ID are required' });
    }
    const newModComPair = await db.insert(communityModerators).values([
      {
        communityId,
        userId
      },
    ]).$returningId();
  
    if (!newModComPair) {
      return next(new Error("Failed to create moderator-community pair"));
    }
    res.status(201).json({ id: newModComPair });
  };

export const getModerators = async (req, res) => {
    const { communityId } = req.params;
  
    if (!communityId) {
      return res.status(400).json({ error: 'Community ID is required' });
    }
  
    try {
      // Query the community_moderators table to get userIds for the given communityId
      const moderators = await db
        .select()
        .from(communityModerators)
        .where(sql`community_id = ${communityId}`); // Use sql template literals for comparison
  
      // Map through the moderators to get detailed user info (if needed)
      const moderatorDetails = await Promise.all(
        moderators.map(async (moderator) => {
          // Fetch user details using the `users.id` reference
          const user = await db
            .select()
            .from(users)
            .where(sql`id = ${moderator.userId}`) // Use sql template literals for comparison
            .limit(1)
            .execute();
  
          return user[0]; // Assuming you get one user per userId
        })
      );
  
      res.status(200).json(moderatorDetails);
    } catch (error) {
      console.error('Error fetching moderators:', error);
      res.status(500).json({ error: 'Failed to fetch moderators' });
    }
  };