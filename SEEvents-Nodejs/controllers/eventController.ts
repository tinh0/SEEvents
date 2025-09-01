import { db } from "../src/drizzle/db.ts";
import {
  commentLikes,
  eventActivity,
  eventAnnouncements,
  eventComments,
  eventDislikes,
  eventGoing,
  eventInterested,
  eventLikes,
  events,
  users,
} from "../src/drizzle/schema.ts";
import {
  eq,
  asc,
  desc,
  and,
  count,
  lte,
  gte,
  getTableColumns,
  gt,
} from "drizzle-orm";
import { moderateContent } from "./contentModeration.ts";
import {
  notificationPreferences,
  communityMembers,
} from "../src/drizzle/schema.ts";

import admin from "firebase-admin"; // Firebase Admin SDK

// Initialize Firebase Admin SDK (if not already done)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "seeventsapp",
      clientEmail:
        "",
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

// @desc Get all events
// @route GET /api/events
export const getEvents = async (req, res, next) => {
  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  nextWeek.setHours(23, 59, 59, 999);

  const listEvents = await db
    .select()
    .from(events)
    .where(
      and(
        //gt(events.endTime, today),
        eq(events.active, true),
        eq(events.deleted, false)
      )
    ) // Filter out events that have already ended
    .orderBy(asc(events.startTime));

  res.status(200).json(listEvents);
};

// @desc Get single event
// @route GET /api/events:id

export const getEvent = async (req, res, next) => {
  const id = parseInt(req.params.id);

  const event = await db.select().from(events).where(eq(events.id, id));

  if (!event) {
    const error = new Error(`An event with the id of ${id} was not found`);
    //error.status = 404;
    return next(error);
  }
  res.status(200).json(event);
};

// @desc Create single event
// @route POST /api/events:id

// Remove the notification code from createEvent since we'll notify at event start instead
export const createEvent = async (req, res, next) => {
  try {
    const { name, description, thumbnailUrl } = req.body;

    // Step 1: Moderate Event Name
    const nameModeration = await moderateContent(name);
    if (!nameModeration.success) {
      return res
        .status(400)
        .json({ error: "Event name: " + nameModeration.error });
    }

    // Step 2: Moderate Event Description
    const descriptionModeration = await moderateContent(description);
    if (!descriptionModeration.success) {
      return res
        .status(400)
        .json({ error: "Event description: " + descriptionModeration.error });
    }

    // Step 3: Moderate Thumbnail URL (if provided)
    if (thumbnailUrl) {
      const thumbnailModeration = await moderateContent(thumbnailUrl, true);
      if (!thumbnailModeration.success) {
        return res
          .status(400)
          .json({ error: "Thumbnail URL: " + thumbnailModeration.error });
      }
    }

    // Step 4: Insert event into the database
    const newEvent = await db
      .insert(events)
      .values([
        {
          id: req.body.id,
          name,
          organizer: req.body.organizer,
          attendeeLimit: req.body.attendeeLimit,
          locationName: req.body.locationName,
          description,
          category: req.body.category,
          locationPointX: req.body.locationPointX,
          locationPointY: req.body.locationPointY,
          thumbnailUrl,
          startTime: new Date(req.body.startTime),
          endTime: new Date(req.body.endTime),
          communityId: req.body.communityId,
          active: true,
          deleted: false,
          organizerId: req.body.organizerId,
          links: req.body.links,
          communityOnly: req.body.communityOnly
        },
      ])
      .onDuplicateKeyUpdate({
        set: {
          id: req.body.id,
          name: req.body.name,
          organizer: req.body.organizer,
          attendeeLimit: req.body.attendeeLimit,
          locationName: req.body.locationName,
          description: req.body.description,
          category: req.body.category,
          locationPointX: req.body.locationPointX,
          locationPointY: req.body.locationPointY,
          thumbnailUrl: req.body.thumbnailUrl,
          startTime: new Date(req.body.startTime),
          endTime: new Date(req.body.endTime),
          communityId: req.body.communityId,
          active: true,
          deleted: false,
          organizerId: req.body.organizerId,
          links: req.body.links,
          communityOnly: req.body.communityOnly
        },
      })
      .$returningId();

    if (!newEvent) {
      return next(new Error("Please include a valid event name"));
    }

    // Step 5: Insert event activity log
    await db.insert(eventActivity).values({
      userId: req.body.organizerId,
      eventId: newEvent[0].id,
      type: "event_create",
    });

    // Step 6: Send the response
    res.status(201).json(newEvent[0]); // Send the newly created event in the response
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// @desc Update single event
// @route PUT /api/events:id

export const updateEvent = async (req, res, next) => {
  const id = parseInt(req.params.id);
  const event = await db
    .update(events)
    .set({
      // change
      name: req.body.name,
      organizer: req.body.organizer,
      attendeeLimit: req.body.attendeeLimit,
      locationName: req.body.locationName,
      description: req.body.description,
      category: req.body.category,
      locationPointX: req.body.locationPointX,
      locationPointY: req.body.locationPointY,
      thumbnailUrl: req.body.thumbnailUrl,
      startTime: new Date(req.body.startTime),
      endTime: new Date(req.body.endTime),
      communityId: req.body.communityId,
      active: true,
      deleted: false,
      organizerId: req.body.organizerId,
      links: req.body.links,
      communityOnly: req.body.communityOnly
    })
    .where(eq(events.id, id));

  if (!event) {
    const error = new Error(`A post with the id of ${id} was not found`);
    //error.status = 404;
    return next(error);
  }

  res.status(200).json(event);
};

// @desc Delete single event
// @route DELETE /api/events:id

export const deleteEvent = async (req, res, next) => {
  const id = parseInt(req.params.id);
  const event = await db
    .update(events)
    .set({
      deleted: true,
    })
    .where(eq(events.id, id));
  if (!event) {
    const error = new Error(`A post with the id of ${id} was not found`);
    //error.status = 404;
    return next(error);
  }
  res.status(201).json({deleted: true});
};

export const activateEvent = async (req, res, next) => {
  const id = parseInt(req.params.id);
  const event = await db.select().from(events).where(eq(events.id, id));
  let isActive;
  if (!event) {
    const error = new Error(`A post with the id of ${id} was not found`);
    //error.status = 404;
    return next(error);
  }
  const active = event[0].active;
  if (!active) {
    await db
      .update(events)
      .set({
        active: true,
      })
      .where(eq(events.id, id));
    isActive = true;
  } else {
    await db
      .update(events)
      .set({
        active: false,
      })
      .where(eq(events.id, id));
    isActive = false;
  }
  res.status(201).json({ active: isActive });
};

// like an event
export const likeEvent = async (req, res, next) => {
  const eventId = parseInt(req.params.id);
  const userId = req.params.userId;
  // check if it's been liked
  const like = await db
    .select()
    .from(eventLikes)
    .where(and(eq(eventLikes.eventId, eventId), eq(eventLikes.userId, userId)));
  // remove like
  if (like.length > 0) {
    await db
      .delete(eventLikes)
      .where(
        and(eq(eventLikes.eventId, eventId), eq(eventLikes.userId, userId))
      );
  } else {
    // add like
    await db.insert(eventLikes).values([
      {
        userId: userId,
        eventId: eventId,
      },
    ]);
    // remove dislikes
    await db
      .delete(eventDislikes)
      .where(
        and(
          eq(eventDislikes.eventId, eventId),
          eq(eventDislikes.userId, userId)
        )
      );

    if ((await checkDuplicateActivity(userId, eventId, "event_like")) == 0) {
      await db.insert(eventActivity).values([
        {
          userId: userId,
          eventId: eventId,
          type: "event_like",
        },
      ]);
    }
  }
  const likeCount = await db
    .select({ count: count() })
    .from(eventLikes)
    .where(and(eq(eventLikes.eventId, eventId)));
  res.status(201).json(likeCount);
};

export const getLikeCount = async (req, res, next) => {
  const eventId = parseInt(req.params.id);
  const likeCount = await db
    .select({ count: count() })
    .from(eventLikes)
    .where(and(eq(eventLikes.eventId, eventId)));
  res.status(201).json(likeCount);
};

// like an event
export const dislikeEvent = async (req, res, next) => {
  const eventId = parseInt(req.params.id);
  const userId = req.params.userId;
  // check if it's been liked
  const dislike = await db
    .select()
    .from(eventDislikes)
    .where(
      and(eq(eventDislikes.eventId, eventId), eq(eventDislikes.userId, userId))
    );
  // remove dislike
  if (dislike.length > 0) {
    await db
      .delete(eventDislikes)
      .where(
        and(
          eq(eventDislikes.eventId, eventId),
          eq(eventDislikes.userId, userId)
        )
      );
  } else {
    // add dislike
    await db.insert(eventDislikes).values([
      {
        userId: userId,
        eventId: eventId,
      },
    ]);

    // remove like
    await db
      .delete(eventLikes)
      .where(
        and(eq(eventLikes.eventId, eventId), eq(eventLikes.userId, userId))
      );
  }
  const likeCount = await db
    .select({ count: count() })
    .from(eventDislikes)
    .where(and(eq(eventDislikes.eventId, eventId)));
  res.status(201).json(likeCount);
};

export const getDislikeCount = async (req, res, next) => {
  const eventId = parseInt(req.params.id);
  const dislikeCount = await db
    .select({ count: count() })
    .from(eventDislikes)
    .where(and(eq(eventDislikes.eventId, eventId)));
  res.status(201).json(dislikeCount);
};

export const dislikedEvent = async (req, res, next) => {
  const eventId = parseInt(req.params.id);
  const userId = req.params.userId;
  // check if it's been liked
  const dislike = await db
    .select()
    .from(eventDislikes)
    .where(
      and(eq(eventDislikes.eventId, eventId), eq(eventDislikes.userId, userId))
    );
  // remove dislike
  if (dislike.length > 0) {
    const disliked = { disliked: true };
    res.status(201).json(disliked);
  } else {
    const disliked = { disliked: false };
    res.status(201).json(disliked);
  }
};

export const likedEvent = async (req, res, next) => {
  const eventId = parseInt(req.params.id);
  const userId = req.params.userId;
  // check if it's been liked
  const like = await db
    .select()
    .from(eventLikes)
    .where(and(eq(eventLikes.eventId, eventId), eq(eventLikes.userId, userId)));
  if (like.length > 0) {
    const liked = { liked: true };
    res.status(201).json(liked);
  } else {
    const liked = { liked: false };
    res.status(201).json(liked);
  }
};

// interested an event
export const interestedEvent = async (req, res, next) => {
  const eventId = parseInt(req.params.id);
  const userId = req.params.userId;
  // check if it's been interested
  const like = await db
    .select()
    .from(eventInterested)
    .where(
      and(
        eq(eventInterested.eventId, eventId),
        eq(eventInterested.userId, userId)
      )
    );
  // remove interested
  if (like.length > 0) {
    await db
      .delete(eventInterested)
      .where(
        and(
          eq(eventInterested.eventId, eventId),
          eq(eventInterested.userId, userId)
        )
      );
  } else {
    // add interested
    await db.insert(eventInterested).values([
      {
        userId: userId,
        eventId: eventId,
      },
    ]);

    if (
      (await checkDuplicateActivity(userId, eventId, "event_interest")) == 0
    ) {
      await db.insert(eventActivity).values([
        {
          userId: userId,
          eventId: eventId,
          type: "event_interest",
        },
      ]);
    }
  }
  const interestCount = await db
    .select({ count: count() })
    .from(eventInterested)
    .where(and(eq(eventInterested.eventId, eventId)));
  res.status(201).json(interestCount);
};

export const getInterestedEvent = async (req, res, next) => {
  const eventId = parseInt(req.params.id);
  const userId = req.params.userId;
  // check if it's been liked
  const interested = await db
    .select()
    .from(eventInterested)
    .where(
      and(
        eq(eventInterested.eventId, eventId),
        eq(eventInterested.userId, userId)
      )
    );
  // remove dislike
  if (interested.length > 0) {
    const interested = { interested: true };
    res.status(201).json(interested);
  } else {
    const interested = { interested: false };
    res.status(201).json(interested);
  }
};

export const getAllInterestedEvent = async (req, res, next) => {
  const eventId = parseInt(req.params.id);
  // check if it's been liked
  const interested = await db
    .select()
    .from(eventInterested)
    .where(eq(eventInterested.eventId, eventId));
  if (!interested) {
    const error = new Error(`Interested in events was not found`);
    //error.status = 404;
    return next(error);
  }
  res.status(201).json(interested);
};

export const getMyEvents = async (req, res, next) => {
  const userId = req.params.id;
  const event = await db
    .select({ ...getTableColumns(events) })
    .from(events)
    .where(and(eq(events.organizerId, userId), eq(events.deleted, false)));
  if (!event) {
    const error = new Error(`Interested in events was not found`);
    //error.status = 404;
    return next(error);
  }
  res.status(201).json(event);
};

export const getAllSavedEvents = async (req, res, next) => {
  const userId = req.params.id;
  const event = await db
    .select({ ...getTableColumns(events) })
    .from(events)
    .rightJoin(eventInterested, eq(events.id, eventInterested.eventId))
    .where(
      and(
        eq(eventInterested.userId, userId),
        eq(events.active, true),
        eq(events.deleted, false)
      )
    );
  if (!event) {
    const error = new Error(`Interested in events was not found`);
    //error.status = 404;
    return next(error);
  }
  res.status(201).json(event);
};

// going to an event
export const goingEvent = async (req, res, next) => {
  const eventId = parseInt(req.params.id);
  const userId = req.params.userId;
  // check if it's been interested
  const like = await db
    .select()
    .from(eventGoing)
    .where(and(eq(eventGoing.eventId, eventId), eq(eventGoing.userId, userId)));
  // remove interested
  if (like.length > 0) {
    await db
      .delete(eventGoing)
      .where(
        and(eq(eventGoing.eventId, eventId), eq(eventGoing.userId, userId))
      );
  } else {
    // add interested
    await db.insert(eventGoing).values([
      {
        userId: userId,
        eventId: eventId,
      },
    ]);
    if ((await checkDuplicateActivity(userId, eventId, "event_going")) == 0) {
      await db.insert(eventActivity).values([
        {
          userId: userId,
          eventId: eventId,
          type: "event_going",
        },
      ]);
    }
  }
  const interestCount = await db
    .select({ count: count() })
    .from(eventGoing)
    .where(and(eq(eventGoing.eventId, eventId)));
  res.status(201).json(interestCount);
};

export const getGoingEvent = async (req, res, next) => {
  const eventId = parseInt(req.params.id);
  const userId = req.params.userId;
  // check if it's been liked
  const interested = await db
    .select()
    .from(eventGoing)
    .where(and(eq(eventGoing.eventId, eventId), eq(eventGoing.userId, userId)));
  // remove dislike
  if (interested.length > 0) {
    const interested = { going: true };
    res.status(201).json(interested);
  } else {
    const interested = { going: false };
    res.status(201).json(interested);
  }
};

export const getAllGoingEvent = async (req, res, next) => {
  const eventId = parseInt(req.params.id);

  try {
    // Join eventGoing with users table to get user profile information
    const attendees = await db
      .select({
        userId: eventGoing.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        // Add other user fields you need
      })
      .from(eventGoing)
      .where(eq(eventGoing.eventId, eventId))
      .leftJoin(users, eq(eventGoing.userId, users.id));

    if (!attendees || attendees.length === 0) {
      return res.status(200).json([]); // Return empty array instead of error
    }

    res.status(200).json(attendees);
  } catch (error) {
    console.error("Error fetching event attendees:", error);
    const err = new Error(`Failed to fetch event attendees: ${error.message}`);
    return next(err);
  }
};

// @desc Get single annoucement
// @route GET /api/events:id
export const getAnnouncementEvent = async (req, res, next) => {
  const id = parseInt(req.params.id);
  const announcement = await db
    .select()
    .from(eventAnnouncements)
    .where(eq(eventAnnouncements.eventId, id));

  if (!announcement) {
    const error = new Error(
      `An announcement on an event with id of ${id} was not found`
    );
    //error.status = 404;
    return next(error);
  }
  res.status(200).json(announcement);
};

// @desc Create single announcement
// @route POST /api/events:id

export const createAnnouncementEvent = async (req, res, next) => {
  const newAnnouncement = await db
    .insert(eventAnnouncements)
    .values([
      {
        userId: req.body.userId,
        eventId: req.body.eventId,
        text: req.body.text,
        timestamp: req.body.timestamp,
      },
    ])
    .$returningId();

  if (!newAnnouncement) {
    const error = new Error(`Please include all fields`);
    //error.status = 404;
    return next(error);
  }

  res.status(201).json(newAnnouncement);
};

// @desc Update single announcement
// @route PUT /api/events:id

export const updateAnnouncementEvent = async (req, res, next) => {
  const id = parseInt(req.params.id);
  const event = await db
    .update(eventAnnouncements)
    .set({
      userId: req.body.userId,
      eventId: req.body.eventId,
      text: req.body.text,
      timestamp: req.body.timestamp,
    })
    .where(eq(eventAnnouncements.eventId, id));

  if (!event) {
    const error = new Error(`Error updating announcement`);
    //error.status = 404;
    return next(error);
  }

  res.status(200).json(event);
};

// @desc Delete single announcement
// @route DELETE /api/events:id

export const deleteAnnouncementEvent = async (req, res, next) => {
  const id = parseInt(req.params.id);
  const event = await db
    .delete(eventAnnouncements)
    .where(eq(eventAnnouncements.eventId, id));
  if (!event) {
    const error = new Error(`Error deleting announcement`);
    //error.status = 404;
    return next(error);
  }
  res.status(201);
};

// @desc Get single event
// @route GET /api/events:id
export const getCommentEvent = async (req, res, next) => {
  const id = parseInt(req.params.id);
  const announcement = await db
    .select({
      id: eventComments.id,
      eventId: eventComments.eventId,
      text: eventComments.text,
      timestamp: eventComments.timestamp,
      userId: eventComments.userId,
      username: users.username,
      pfpUrl: users.pfpUrl,
      imageUrl: eventComments.imageUrl,
    })
    .from(eventComments)
    .innerJoin(users, eq(eventComments.userId, users.id))
    .where(and(eq(eventComments.eventId, id), eq(eventComments.deleted, false)))
    .orderBy(desc(eventComments.timestamp));

  if (!announcement) {
    const error = new Error(
      `A comment on an event with id of ${id} was not found`
    );
    //error.status = 404;
    return next(error);
  }
  res.status(200).json(announcement);
};

// @desc Create single event
// @route POST /api/events:id

export const createCommentEvent = async (req, res, next) => {
  const { userId, eventId, text, imageUrl } = req.body;

  // Step 0: Validate that the comment text is not empty
  if (!text || text.trim() === "") {
    return res.status(400).json({
      success: false,
      error: "Comment cannot be empty. Please provide some text.",
    });
  }

  // Step 1: Moderate the comment text content
  const textModerationResult = await moderateContent(text);

  if (!textModerationResult.success) {
    return res.status(400).json(textModerationResult);
  }

  // Step 2: Moderate the image URL (if provided)
  if (imageUrl) {
    const imageModerationResult = await moderateContent(imageUrl, true); // Pass `true` to indicate it's a URL

    if (!imageModerationResult.success) {
      return res.status(400).json(imageModerationResult);
    }
  }

  // Step 3: If the comment passes moderation, insert it into the database
  try {
    const newComment = await db
      .insert(eventComments)
      .values([
        {
          userId,
          eventId,
          text,
          timestamp: new Date(),
          imageUrl: req.body.imageUrl,
        },
      ])
      .$returningId();

    if (!newComment) {
      return res.status(400).json({
        success: false,
        error: "Please include all fields",
      });
    }

    // Step 4: Log the comment activity
    await db.insert(eventActivity).values([
      {
        userId,
        eventId,
        type: "event_comment",
        commentId: newComment[0].id,
      },
    ]);

    // Step 5: Return the new comment as a response
    res.status(201).json({
      success: true,
      data: newComment,
    });
  } catch (error) {
    console.error("Error inserting comment into database:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// @desc Update single event
// @route PUT /api/events:id

export const updateCommentEvent = async (req, res, next) => {
  const id = parseInt(req.params.id);
  const event = await db
    .update(eventComments)
    .set({
      userId: req.body.userId,
      eventId: req.body.eventId,
      text: req.body.text,
      timestamp: req.body.timestamp,
    })
    .where(eq(eventComments.eventId, id));

  if (!event) {
    const error = new Error(`Error updating comment`);
    //error.status = 404;
    return next(error);
  }

  res.status(200).json(event);
};

// @desc Delete single comment
// @route DELETE /api/events:id

export const deleteCommentEvent = async (req, res, next) => {
  const id = parseInt(req.params.commentId);
  const comment = await db
    .update(eventComments)
    .set({ deleted: true })
    .where(eq(eventComments.id, id))
    .then(() => {
      db.update(eventActivity)
        .set({ deleted: true })
        .where(eq(eventActivity.commentId, id))
        .then(() => {
          res.status(200).json({ deleted: true });
        });
    });

  // if (!comment || !activity) {
  //   const error = new Error(`Error deleting comment`);
  //   //error.status = 404;
  //   return next(error);
  // }
};

// like a comment
export const likeComment = async (req, res, next) => {
  const commentId = parseInt(req.params.id);
  const userId = req.params.userId;
  // check if it's been liked
  const like = await db
    .select()
    .from(commentLikes)
    .where(
      and(
        eq(commentLikes.commentId, commentId),
        eq(commentLikes.userId, userId)
      )
    );
  // remove like
  if (like.length > 0) {
    await db
      .delete(commentLikes)
      .where(
        and(
          eq(commentLikes.commentId, commentId),
          eq(commentLikes.userId, userId)
        )
      );
  } else {
    // add like
    await db.insert(commentLikes).values([
      {
        userId: userId,
        commentId: commentId,
      },
    ]);
  }
  const likeCount = await db
    .select({ count: count() })
    .from(commentLikes)
    .where(and(eq(commentLikes.commentId, commentId)));
  res.status(201).json(likeCount);
};

export const getLikeCommentCount = async (req, res, next) => {
  const commentId = parseInt(req.params.id);
  const likeCount = await db
    .select({ count: count() })
    .from(commentLikes)
    .where(and(eq(commentLikes.commentId, commentId)));
  res.status(201).json(likeCount);
};

export const likedComment = async (req, res, next) => {
  const commentId = parseInt(req.params.id);
  const userId = req.params.userId;
  // check if it's been liked
  const like = await db
    .select()
    .from(commentLikes)
    .where(
      and(
        eq(commentLikes.commentId, commentId),
        eq(commentLikes.userId, userId)
      )
    );
  if (like.length > 0) {
    const liked = { liked: true };
    res.status(201).json(liked);
  } else {
    const liked = { liked: false };
    res.status(201).json(liked);
  }
};

const checkDuplicateActivity = async (userId, eventId, type) => {
  const activity = await db
    .select()
    .from(eventActivity)
    .where(
      and(
        eq(eventActivity.userId, userId),
        eq(eventActivity.eventId, eventId),
        eq(eventActivity.type, type)
      )
    );
  return activity.length;
};

// Function to send notifications when events are about to start
export const sendEventStartNotifications = async () => {
  try {
    // Get events that start soon (within the next 10 minutes)
    const currentTime = new Date();
    const tenMinutesLater = new Date(currentTime.getTime() + 10 * 60000);

    const upcomingEvents = await db
      .select()
      .from(events)
      .where(
        and(
          gte(events.startTime, currentTime),
          lte(events.startTime, tenMinutesLater),
          eq(events.active, true),
          eq(events.deleted, false)
        )
      );

    // Process each upcoming event
    for (const event of upcomingEvents) {
      // Get users who should be notified based on criteria
      const usersToNotify = await getUsersToNotify(event);

      if (usersToNotify.length > 0) {
        // Extract FCM tokens - use type predicate to inform TypeScript that nulls are filtered out
        const tokens = usersToNotify
          .map((user) => user.fcmToken)
          .filter((token): token is string => token !== null && token !== "");

        if (tokens.length > 0) {
          // Send notifications
          const message = {
            notification: {
              title: "Event Starting Soon!",
              body: `The event "${event.name}" will start soon.`,
            },
            data: {
              eventId: event.id.toString(),
              type: "EVENT_START",
              clickAction: "OPEN_EVENT", // This helps with routing
            },
            tokens,
          };

          try {
            await admin.messaging().sendEachForMulticast(message);
            console.log(`Event start notifications sent for event ${event.id}`);
          } catch (error) {
            console.error("Error sending event start notifications:", error);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in event start notification process:", error);
  }
};

// Define a type for User based on your schema
type User = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  pfpUrl: string | null;
  fcmToken: string | null;
  // Add any other user properties as needed
};

// Function to get users who should be notified about an event
async function getUsersToNotify(event): Promise<User[]> {
  // 1. Users who are "going" to the event
  const goingUsers = await db
    .select({
      ...getTableColumns(users),
    })
    .from(users)
    .innerJoin(eventGoing, eq(users.id, eventGoing.userId))
    .where(eq(eventGoing.eventId, event.id));

  // 2. Users with notification preferences for this event category
  const categoryUsers = await db
    .select({
      ...getTableColumns(users),
    })
    .from(users)
    .innerJoin(
      notificationPreferences,
      eq(users.id, notificationPreferences.userId)
    )
    .where(eq(notificationPreferences.filterType, event.category));

  // 3. Users who are members of the same community
  let communityUsers: typeof goingUsers = [];
  if (event.communityId) {
    communityUsers = await db
      .select({
        ...getTableColumns(users),
      })
      .from(users)
      .innerJoin(communityMembers, eq(users.id, communityMembers.userId))
      .where(eq(communityMembers.communityId, event.communityId));
  }

  // Combine all users, ensuring no duplicates by user ID
  const allUsers = [...goingUsers, ...categoryUsers, ...communityUsers];
  const uniqueUsers = Array.from(
    new Map(allUsers.map((user) => [user.id, user])).values()
  );

  return uniqueUsers;
}

// Function to schedule the notification check
export const setupEventNotificationScheduler = () => {
  // Check for upcoming events every 5 minutes
  const FIVE_MINUTES = 5 * 60 * 1000;

  setInterval(async () => {
    await sendEventStartNotifications();
  }, FIVE_MINUTES);

  // Run immediately on startup
  sendEventStartNotifications();

  console.log("Event notification scheduler started");
};
