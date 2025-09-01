import express from 'express';
import { getUser } from '../controllers/userController.js';

const router = express.Router();

// GET route to handle fetching a user by their ID
router.get('/:id', getUser);

export default router;