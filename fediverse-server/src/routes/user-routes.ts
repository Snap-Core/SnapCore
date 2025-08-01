import express from 'express';
import { getPersonFromUsername } from '../controllers/user-controller';

const router = express.Router();

router.get('/:username', getPersonFromUsername);

export default router