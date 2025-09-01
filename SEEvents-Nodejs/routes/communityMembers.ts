import express from 'express';
const router = express.Router();
import { addMember, getMembers, removeMember } from '../controllers/communityMembersController.ts';
import { getCommunityRequests, addCommunityRequest, deleteCommunityRequest, getCommunityRequestMember } from '../controllers/communityMembersController.ts';

// POST route to add a user as a member to a community
router.post('/', addMember);
// GET route to fetch members for a community
router.get('/:communityId', getMembers);
// remove member from community
router.delete('/', removeMember);

router.get('/request/:id', getCommunityRequests)
router.get('/request/member/:id/:communityId', getCommunityRequestMember)
router.post('/request', addCommunityRequest);
router.delete('/request/:id/:communityId', deleteCommunityRequest)

export default router;