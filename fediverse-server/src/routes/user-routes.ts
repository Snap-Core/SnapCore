import express from 'express';
import {
  getExternalUserFromUsername, getPersonFollowersByUsername, getPersonFollowingByUsername,
  getPersonFromUsername,
  searchExternalUsers
} from '../controllers/user-controller';
import {requireAuth} from "../middleware/auth-middleware";

const router = express.Router();

router.get('/external', getExternalUserFromUsername);
router.post('/search-external', requireAuth, searchExternalUsers);
router.get('/:username/following', getPersonFollowingByUsername);
router.get('/:username/followers', getPersonFollowersByUsername);
router.get('/:username', getPersonFromUsername);

export default router;