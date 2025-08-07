import express from 'express';
import {
  getExternalUserFromUsername, getOutbox, getPersonFollowersByUsername, getPersonFollowingByUsername,
  getPersonFromUsername, handleInboxPost,
  searchExternalUsers
} from '../controllers/user-controller';
import {requireAuth} from "../middleware/auth-middleware";

const router = express.Router();

router.get('/external', requireAuth, getExternalUserFromUsername);
router.post('/search-external', requireAuth, searchExternalUsers);
router.post('/:username/inbox', handleInboxPost);
router.get('/:username/outbox', getOutbox);
router.get('/:username/following', getPersonFollowingByUsername);
router.get('/:username/followers', getPersonFollowersByUsername);
router.get('/:username', getPersonFromUsername);

export default router;