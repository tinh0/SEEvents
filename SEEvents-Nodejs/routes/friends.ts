import express from 'express';
import { 
  sendFriendRequest, 
  denyFriendRequest, 
  acceptFriendRequest, 
  unfriendConnection, 
  getIncomingFriendRequests, 
  getCurrentFriends 
} from '../controllers/friendsController.ts';

const router = express.Router();

// Send a friend request
router.post('/send', sendFriendRequest);

// Deny a friend request
router.post('/deny', denyFriendRequest);

// Accept a friend request
router.post('/accept', acceptFriendRequest);

// Unfriend an existing connection
router.post('/unfriend', unfriendConnection);

// Get incoming friend requests
router.get('/incoming/:user_id', getIncomingFriendRequests);

// Get current friends
router.get('/friends/:user_id', getCurrentFriends);

export default router;
