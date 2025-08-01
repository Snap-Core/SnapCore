import express from 'express';
import { handleInboxPost } from '../controller/inboxController';

const router = express.Router();

router.post('/', handleInboxPost);

export default router;
