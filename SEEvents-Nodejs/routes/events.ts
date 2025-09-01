import express from "express";
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  likeEvent,
  getLikeCount,
  dislikeEvent,
  getDislikeCount,
  dislikedEvent,
  likedEvent,
  interestedEvent,
  getInterestedEvent,
  getAllInterestedEvent,
  goingEvent,
  getGoingEvent,
  getAllGoingEvent,
  likeComment,
  getLikeCommentCount,
  likedComment,
  createAnnouncementEvent,
  getAnnouncementEvent,
  updateAnnouncementEvent,
  deleteAnnouncementEvent,
  createCommentEvent,
  getCommentEvent,
  updateCommentEvent,
  deleteCommentEvent,
  getAllSavedEvents,
  getMyEvents,
  activateEvent
} from "../controllers/eventController.ts";
const router = express.Router();

// Get all events
router.get("/", getEvents);

// Get single event
router.get("/:id", getEvent);

// Get my events
router.get("/myEvents/:id", getMyEvents);

// Create new event
router.post("/", createEvent);

// Update Event
router.put("/:id", updateEvent);

//Delete Event
router.delete("/:id", deleteEvent);

// Deactivate Event
router.put("/activate/:id", activateEvent);

//likes ---------
router.post("/:id/like/:userId", likeEvent);
router.get("/:id/likeCount", getLikeCount);
router.get("/:id/like/:userId", likedEvent);

//dislikes ---------
router.post("/:id/dislike/:userId", dislikeEvent);
router.get("/:id/dislike/:userId", dislikedEvent);
router.get("/:id/dislikeCount", getDislikeCount);

// interested
router.post("/:id/interested/:userId", interestedEvent);
router.get("/:id/interested/:userId", getInterestedEvent);
router.get("/:id/interested", getAllInterestedEvent);
router.get("/saved/:id", getAllSavedEvents);

// going
router.post("/:id/going/:userId", goingEvent);
router.get("/:id/going/:userId", getGoingEvent);
router.get("/:id/going", getAllGoingEvent);

//comments
router.post("/:id/comments/:userId", createCommentEvent);
router.get("/:id/comments/", getCommentEvent);
router.put("/:id/comments/:userId", updateCommentEvent);
router.get("/comments/delete/:commentId", deleteCommentEvent);

//likes ---------
router.post("/:id/likeComment/:userId", likeComment);
router.get("/:id/likeCountComment", getLikeCommentCount);
router.get("/:id/likeComment/:userId", likedComment);

// announcements
router.post("/:id/announcements/:userId", createAnnouncementEvent);
router.get("/:id/announcements/", getAnnouncementEvent);
router.put("/:id/announcements/:userId", updateAnnouncementEvent);
router.delete("/:id/announcements/:userId", deleteAnnouncementEvent);

export default router;
