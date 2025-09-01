import { Request, Response, RequestHandler } from "express";
import { db } from "../src/drizzle/db.ts";
import {
  communityMembers,
  communityRequests,
  eventActivity,
  users,
} from "../src/drizzle/schema.ts";
import { eq, and, getTableColumns } from "drizzle-orm";

// Add a user as a member to a community
export const addMember: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId, communityId } = req.body;

    // Validate input
    if (!userId || !communityId) {
      res.status(400).json({ error: "UserId and CommunityId are required" });
      return; // Do not return Response, just exit the function
    }

    // Check if the membership already exists
    const existingMembership = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.userId, userId),
          eq(communityMembers.communityId, communityId)
        )
      );

    if (existingMembership.length > 0) {
      res
        .status(400)
        .json({ error: "User is already a member of the community" });
      return;
    }
    console.log("HIIIIIIIIIIi");
    // Insert a new membership record
    await db.insert(communityMembers).values({ userId, communityId });
    await db.insert(eventActivity).values([
      {
        userId: req.body.userId,
        communityId: communityId,
        type: "community_join",
      },
    ]);

    res.status(201).json({ message: "Member added successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while adding the member" });
  }
};

// Get members of a specific community
export const getMembers: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { communityId } = req.params;

    if (!communityId) {
      res.status(400).json({ error: "CommunityId is required" });
      return;
    }

    // Fetch members of the community
    const members = await db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(communityMembers)
      .innerJoin(users, eq(users.id, communityMembers.userId))
      .where(eq(communityMembers.communityId, Number(communityId)));

    res.status(200).json(members);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the members" });
  }
};

export const removeMember: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId, communityId } = req.body;

    if (!userId || !communityId) {
      res.status(400).json({ error: "UserId and CommunityId are required" });
      return;
    }

    // Check if the user is a member of the community
    const membership = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.userId, userId),
          eq(communityMembers.communityId, Number(communityId))
        )
      );

    if (membership.length === 0) {
      res.status(400).json({ error: "User is not a member of the community" });
      return;
    }

    // Delete the membership record
    await db
      .delete(communityMembers)
      .where(
        and(
          eq(communityMembers.userId, userId),
          eq(communityMembers.communityId, Number(communityId))
        )
      );

    res.status(200).json({ message: "Member removed successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while removing the member" });
  }
};

export const getCommunityRequests = async (req, res, next) => {
  const communityId = parseInt(req.params.id);
  const requests = await db
    .select({
      id: users.id,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(users)
    .rightJoin(communityRequests, eq(communityRequests.userId, users.id))
    .where(eq(communityRequests.communityId, communityId));
  return res.status(200).json(requests);
};

export const getCommunityRequestMember = async (req, res, next) => {
  const userId = req.params.id;
  const communityId = parseInt(req.params.communityId);
  const requests = await db
    .select()
    .from(communityRequests)
    .where(
      and(
        eq(communityRequests.communityId, communityId),
        eq(userId, communityRequests.userId)
      )
    );
  if (requests.length > 0) {
    return res.status(200).json({ requested: true });
  } else {
    return res.status(200).json({ requested: false });
  }
};

export const addCommunityRequest = async (req, res, next) => {
  const userId = req.body.userId;
  const communityId = parseInt(req.body.communityId);
  await db
    .insert(communityRequests)
    .values([{ userId: userId, communityId: communityId }]);
  return res.status(200).json({ added: true });
};

export const deleteCommunityRequest = async (req, res, next) => {
  const userId = req.params.id;
  const communityId = parseInt(req.params.communityId);

  await db
    .delete(communityRequests)
    .where(
      and(
        eq(communityRequests.communityId, communityId),
        eq(communityRequests.userId, userId)
      )
    );
  return res.status(200).json({ delete: true });
};
