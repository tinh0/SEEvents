import express from 'express';
import { 
  getCommunityMessages, 
  sendCommunityMessage, 
  deleteCommunityMessage 
} from '../controllers/communityChatController.ts';

const router = express.Router();

// Get all messages for a specific community
router.get('/:communityId', getCommunityMessages);

// Send a new message to a community chat
router.post('/send', sendCommunityMessage);

// Delete a message from the community chat
router.delete('/:messageId', deleteCommunityMessage);

export default router;