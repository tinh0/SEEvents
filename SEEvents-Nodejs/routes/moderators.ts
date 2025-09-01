// src/routes/moderatorRoutes.js
import express from 'express';
const router = express.Router();
import { addModerator, getModerators } from '../controllers/moderatorController';

// POST route to add a user as a moderator to a community
router.post('/', addModerator);
// GET route to fetch moderators for a community
router.get('/:communityId', getModerators);

export default router;