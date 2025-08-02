import express from 'express';
import {getExternalUserPageFromUsername, getPersonFromUsername} from '../controllers/user-controller';

const router = express.Router();

router.get('/external', getExternalUserPageFromUsername);
router.get('/:username', getPersonFromUsername);

export default router