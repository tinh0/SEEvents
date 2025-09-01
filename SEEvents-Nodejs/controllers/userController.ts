import { db } from "../src/drizzle/db.ts";
import {
  communities,
  eventActivity,
  eventComments,
  events,
  users,
  notificationPreferences,
} from "../src/drizzle/schema.ts";
import { eq, desc, and } from "drizzle-orm";
import { moderateContent } from "./contentModeration.ts";

// @desc Get all users
// @route GET /api/users
export const getUsers = async (req, res, next) => {
  const listUsers = await db.select().from(users);
  res.status(200).json(listUsers);
};

// @desc Get single user
// @route GET /api/users:id

export const getUser = async (req, res, next) => {
  const id = req.params.id;
  const user = await db.select().from(users).where(eq(users.id, id));

  if (!user) {
    const error = new Error(`A user with the id of ${id} was not found`);
    //error.status = 404;
    return next(error);
  }
  res.status(200).json(user);
};

export const getUserByEmail = async (req, res, next) => {
  const email = req.params.id;
  const user = await db.select().from(users).where(eq(users.email, email));

  if (!user) {
    const error = new Error(`A user with the email ${email} was not found`);
    //error.status = 404;
    return next(error);
  }
  if (user.length > 0) {
    res.status(200).json({ exists: true });
  } else {
    res.status(200).json({ exists: false });
  }
};

// @desc Create single user
// @route POST /api/users:id

export const createUser = async (req, res, next) => {
  try {
    // Moderate username
    if (req.body.username) {
      const usernameCheck = await moderateContent(req.body.username);
      if (!usernameCheck.success) {
        return res
          .status(400)
          .json({ error: `Username: ${usernameCheck.error}` });
      }
    } else {
      return res.status(400).json({ error: "Username is required." });
    }

    // Moderate firstName if provided
    if (req.body.firstName) {
      const firstNameCheck = await moderateContent(req.body.firstName);
      if (!firstNameCheck.success) {
        return res
          .status(400)
          .json({ error: `First name: ${firstNameCheck.error}` });
      }
    }

    // Moderate lastName if provided
    if (req.body.lastName) {
      const lastNameCheck = await moderateContent(req.body.lastName);
      if (!lastNameCheck.success) {
        return res
          .status(400)
          .json({ error: `Last name: ${lastNameCheck.error}` });
      }
    }

    // Moderate profile picture URL if provided
    if (req.body.pfpUrl) {
      const pfpCheck = await moderateContent(req.body.pfpUrl, true); // Pass true for URL moderation
      if (!pfpCheck.success) {
        return res
          .status(400)
          .json({ error: `Profile picture: ${pfpCheck.error}` });
      }
    }

    // After all moderation checks pass, create the user
    const newUser = await db
      .insert(users)
      .values([
        {
          id: req.body.id,
          username: req.body.username,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          pfpUrl: req.body.pfpUrl,
          fcmToken: req.body.fcmToken,
        },
      ])
      .$returningId();

    if (!newUser) {
      return res.status(400).json({ error: "Missing user information." });
    }

    res.status(201).json(newUser);
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Failed to create user." });
  }
};

// @desc Update single user
// @route PUT /api/users:id

export const updateUser = async (req, res, next) => {
  const id = req.params.id;

  try {
    // Check if user exists first
    const existingUsers = await db.select().from(users).where(eq(users.id, id));

    if (!existingUsers || existingUsers.length === 0) {
      return res
        .status(404)
        .json({ error: `User with id ${id} was not found` });
    }

    // Moderate username if provided
    if (req.body.username) {
      const usernameCheck = await moderateContent(req.body.username);
      if (!usernameCheck.success) {
        return res
          .status(400)
          .json({ error: `Username: ${usernameCheck.error}` });
      }
    }

    // Moderate firstName if provided
    if (req.body.firstName) {
      const firstNameCheck = await moderateContent(req.body.firstName);
      if (!firstNameCheck.success) {
        return res
          .status(400)
          .json({ error: `First name: ${firstNameCheck.error}` });
      }
    }

    // Moderate lastName if provided
    if (req.body.lastName) {
      const lastNameCheck = await moderateContent(req.body.lastName);
      if (!lastNameCheck.success) {
        return res
          .status(400)
          .json({ error: `Last name: ${lastNameCheck.error}` });
      }
    }

    // Moderate profile picture URL if provided
    if (req.body.pfpUrl) {
      const pfpCheck = await moderateContent(req.body.pfpUrl, true); // Pass true for URL moderation
      if (!pfpCheck.success) {
        return res
          .status(400)
          .json({ error: `Profile picture: ${pfpCheck.error}` });
      }
    }

    // After all moderation checks pass, update the user
    await db
      .update(users)
      .set({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        pfpUrl: req.body.pfpUrl,
      })
      .where(eq(users.id, id));

    // Fetch the updated user data with a separate query
    const updatedUsers = await db.select().from(users).where(eq(users.id, id));
    const updatedUser = updatedUsers[0];

    // Return the updated user data
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Failed to update user." });
  }
};

export const updatePfp = async (req, res, next) => {
  const id = req.params.id;
  const pfpUrl = req.body.pfpUrl;

  try {
    // Step 1: Moderate the profile picture URL
    const moderationResult = await moderateContent(pfpUrl, true); // Pass `true` for URL moderation

    if (!moderationResult.success) {
      console.warn("Profile picture rejected:", moderationResult.error);
      return res.status(400).json({ error: moderationResult.error }); // Return meaningful error
    }

    // Step 2: Update the user's profile picture if moderation passes
    const user = await db
      .update(users)
      .set({
        pfpUrl: pfpUrl,
      })
      .where(eq(users.id, id));

    if (!user) {
      return res
        .status(404)
        .json({ error: `User with id ${id} was not found` });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ error: "Internal Server Error. Please try again." });
  }
};

// @desc Delete single user
// @route DELETE /api/users:id

export const deleteUser = async (req, res, next) => {
  const id = req.params.id;
  const user = await db.delete(users).where(eq(users.id, id));
  if (!user) {
    const error = new Error(`A user with the id of ${id} was not found`);
    //error.status = 404;
    return next(error);
  }
  res.status(201);
};

export const getUserActivities = async (req, res, next) => {
  const userId = req.params.id;
  const list = await db
    .select({
      id: eventActivity.id,
      userId: eventActivity.userId,
      eventId: eventActivity.eventId,
      type: eventActivity.type,
      timestamp: eventActivity.timestamp,
      commentId: eventActivity.commentId,
      deleted: eventActivity.deleted,
      thumbnailUrl: events.thumbnailUrl,
      commentText: eventComments.text,
      eventName: events.name,
      eventTime: events.startTime,
      communityId: eventActivity.communityId,
      communityName: communities.name,
      communityImage: communities.iconUrl,
    })
    .from(eventActivity)
    .where(
      and(eq(eventActivity.userId, userId), eq(eventActivity.deleted, false))
    )
    .orderBy(desc(eventActivity.timestamp))
    .leftJoin(eventComments, eq(eventActivity.commentId, eventComments.id))
    .leftJoin(events, eq(eventActivity.eventId, events.id))
    .leftJoin(communities, eq(eventActivity.communityId, communities.id));
  if (!list) {
    const error = new Error(`Error getting user activities`);
    return next(error);
  }
  res.status(200).json(list);
};

export const deleteUserActivity = async (req, res, next) => {
  const id = parseInt(req.params.id);
  const event = await db
    .update(eventActivity)
    .set({
      deleted: true,
    })
    .where(eq(eventActivity.id, id));
  if (!event) {
    const error = new Error(`A post with the id of ${id} was not found`);
    //error.status = 404;
    return next(error);
  }
  res.status(201).json({ success: true });
};

export const updateToken = async (req, res, next) => {
  const id = req.params.id;
  const user = await db
    .update(users)
    .set({
      fcmToken: req.body.fcmToken,
    })
    .where(eq(users.id, id));

  if (!user) {
    const error = new Error(`A post with the id of ${id} was not found`);
    //error.status = 404;
    return next(error);
  }

  res.status(200).json(user);
};

// Get user notification preferences
export const getUserNotificationPreferences = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Validate user exists
    const user = await db.select().from(users).where(eq(users.id, userId));
    if (!user || user.length === 0) {
      return res
        .status(404)
        .json({ message: `User with id ${userId} not found` });
    }

    // Get preferences
    const userPreferences = await db
      .select({ filterType: notificationPreferences.filterType })
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));

    // Extract filter types
    const preferences = userPreferences.map((pref) => pref.filterType);

    return res.status(200).json({ preferences });
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return res.status(500).json({ message: "Failed to fetch preferences" });
  }
};

// Update user notification preferences
export const updateNotificationPreferences = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { preferences } = req.body;

    // Validate user exists
    const user = await db.select().from(users).where(eq(users.id, userId));
    if (!user || user.length === 0) {
      return res
        .status(404)
        .json({ message: `User with id ${userId} not found` });
    }

    // Validate preferences format
    if (!Array.isArray(preferences)) {
      return res.status(400).json({
        message:
          "Invalid preferences format. Expected an array of filter types.",
      });
    }

    // Transaction to delete old preferences and insert new ones
    await db.transaction(async (tx) => {
      // Delete existing preferences
      await tx
        .delete(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId));

      // If there are new preferences, insert them
      if (preferences.length > 0) {
        const prefsToInsert = preferences.map((filterType) => ({
          id: `${userId}_${filterType.replace(/\s+/g, "_").toLowerCase()}`,
          userId,
          filterType,
        }));

        await tx.insert(notificationPreferences).values(prefsToInsert);
      }
    });

    return res.status(200).json({
      message: "Notification preferences updated successfully",
      preferences,
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return res.status(500).json({ message: "Failed to update preferences" });
  }
};

// @desc Change user password
// @route POST /api/users/change-password/:id
export const changePassword = async (req, res, next) => {
  const userId = req.params.id;

  try {
    // Verify user exists
    const user = await db.select().from(users).where(eq(users.id, userId));

    if (!user || user.length === 0) {
      return res
        .status(404)
        .json({ error: `User with id ${userId} not found` });
    }

    // Note: Actual password change happens in Firebase Authentication
    // This endpoint is just to acknowledge the password change in your backend
    // You could log password changes, update password change timestamps, etc.

    return res.status(200).json({
      message: "Password changed successfully",
      userId: userId,
    });
  } catch (error) {
    console.error("Error processing password change:", error);
    return res.status(500).json({ error: "Failed to process password change" });
  }
};
