import express from 'express';
import {getExternalUserFromUsername, getPersonFromUsername} from '../controllers/user-controller';
import {requireAuth} from "../middleware/auth-middleware";

const router = express.Router();

router.get('/external', requireAuth, getExternalUserFromUsername);
router.get('/:username', getPersonFromUsername);

export default router