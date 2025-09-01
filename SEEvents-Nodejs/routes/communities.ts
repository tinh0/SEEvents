import express from 'express';
import {
  getCommunities,
  getCommunity,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  getMyCommunites,
  getCommunityEvents,
} from '../controllers/communityController.ts';

const router = express.Router();

router.get("/", getCommunities);
router.get("/:id", getCommunity);
router.get("/events/:id", getCommunityEvents);
router.get("/mycommunities/:id", getMyCommunites);
router.post("/", createCommunity);
router.put("/:id", updateCommunity);
router.delete("/:id", deleteCommunity);

export default router;
