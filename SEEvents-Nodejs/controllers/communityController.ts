import { db } from "../src/drizzle/db.ts";
import {
  communities,
  communityModerators,
  communityRequests,
  eventActivity,
} from "../src/drizzle/schema.ts";
import { communityMembers, events } from "../src/drizzle/schema.ts";
import { eq, and } from "drizzle-orm";
import { moderateContent } from "./contentModeration.ts";

// Get all communities
export const getCommunities = async (req, res, next) => {
  const listCommunities = await db.select().from(communities);
  res.status(200).json(listCommunities);
};

// Get a single community
export const getCommunity = async (req, res, next) => {
  const id = parseInt(req.params.id);
  const community = await db
    .select()
    .from(communities)
    .where(eq(communities.id, id));
  if (!community) {
    return next(new Error(`Community with ID ${id} not found`));
  }
  res.status(200).json(community);
};

// Get all communities by user id
export const getMyCommunites = async (req, res, next) => {
  const id = req.params.id;
  const community = await db
    .select()
    .from(communities)
    .innerJoin(
      communityMembers,
      eq(communities.id, communityMembers.communityId)
    )
    .where(eq(communityMembers.userId, id));
  if (!community) {
    return next(new Error(`Community with ID ${id} not found`));
  }
  res.status(200).json(community);
};

// Get commmunity events by id
export const getCommunityEvents = async (req, res, next) => {
  const id = parseInt(req.params.id);
  const event = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.communityId, id),
        eq(events.active, true),
        eq(events.deleted, false)
      )
    );
  res.status(200).json(event);
};

// Define a type for the returned data
type CommunityIdResponse = { id: number }[]; // Assuming the response is an array of objects with `id`
// Create a community
export const createCommunity = async (req, res, next) => {
  const { name, contactEmail, category, description, iconUrl, userId, closed } =
    req.body;

  try {
    // Step 1: Moderate text fields (name, description, etc.)
    const textFieldsToModerate = [
      { field: "name", value: name },
      { field: "description", value: description },
      { field: "category", value: category },
    ];

    for (const { field, value } of textFieldsToModerate) {
      const moderationResult = await moderateContent(value);
      if (!moderationResult.success) {
        return res.status(400).json({
          success: false,
          error: `Moderation failed for ${field}: ${moderationResult.error}`,
        });
      }
    }

    // Step 2: Moderate the iconUrl (if provided)
    if (iconUrl) {
      const urlModerationResult = await moderateContent(iconUrl, true); // Pass `true` to indicate it's a URL
      if (!urlModerationResult.success) {
        return res.status(400).json({
          success: false,
          error: `Moderation failed for iconUrl: ${urlModerationResult.error}`,
        });
      }
    }

    // Step 3: If all fields pass moderation, create the community
    const newCommunity = (await db
      .insert(communities)
      .values([
        {
          name,
          contactEmail,
          category,
          description,
          iconUrl: iconUrl || "",
          closed,
        },
      ])
      .$returningId()) as CommunityIdResponse;

    // Extract the ID safely
    const communityId = newCommunity[0]?.id;

    if (!communityId) {
      throw new Error("Failed to retrieve new community ID");
    }

    // Step 4: Add the user as a member and moderator
    await db.insert(communityMembers).values([{ userId, communityId }]);

    await db
      .insert(communityModerators)
      .values([{ userId, communityId }])
      .$returningId();

    // Step 5: Log the community creation activity
    await db.insert(eventActivity).values([
      {
        userId,
        communityId,
        type: "community_create",
      },
    ]);

    // Step 6: Return the new community ID
    res.status(201).json({ id: communityId });
  } catch (error) {
    console.error("Error creating community:", error);
    next(error);
  }
};

// Update a community
export const updateCommunity = async (req, res, next) => {
  const id = parseInt(req.params.id);
  const updated = await db
    .update(communities)
    .set({
      name: req.body.name,
      contactEmail: req.body.contactEmail,
      category: req.body.category,
      description: req.body.description,
      iconUrl: req.body.iconUrl || "",
      closed: req.body.closed,
    })
    .where(eq(communities.id, id));

  if (!updated) {
    return next(new Error(`Community with ID ${id} not found`));
  }
  res.status(200).json(updated);
};

// Delete a community and its associated members and moderators
export const deleteCommunity = async (req, res, next) => {
  const id = parseInt(req.params.id);

  // Delete community members first
  await db.delete(communityMembers).where(eq(communityMembers.communityId, id));

  // Delete community moderators
  await db
    .delete(communityModerators)
    .where(eq(communityModerators.communityId, id));

  // Now delete the community
  const deleted = await db.delete(communities).where(eq(communities.id, id));
  if (!deleted) {
    return next(new Error(`Community with ID ${id} not found`));
  }
  res.status(200).send(`Community with ID ${id} deleted`);
};
