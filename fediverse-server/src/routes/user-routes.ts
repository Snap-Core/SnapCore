import express from 'express';
import {
  getExternalUserFromUsername, 
  getPersonFromUsername,
  searchExternalUsers
} from '../controllers/user-controller';

const router = express.Router();

router.get('/external', getExternalUserFromUsername);
router.post('/search-external', searchExternalUsers); 
router.get('/:username', getPersonFromUsername);

export default router;