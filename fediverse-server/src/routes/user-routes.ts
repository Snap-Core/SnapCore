import express from 'express';
import {getExternalUserFromUsername, getPersonFromUsername} from '../controllers/user-controller';

const router = express.Router();

router.get('/external', getExternalUserFromUsername);
router.get('/:username', getPersonFromUsername);

export default router