import express from 'express';
import {getExternalPersonFromUsername, getPersonFromUsername} from '../controllers/user-controller';

const router = express.Router();

router.get('/external', getExternalPersonFromUsername);
router.get('/:username', getPersonFromUsername);

export default router