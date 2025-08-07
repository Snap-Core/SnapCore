import express from 'express';
import { handleInboxPost } from '../controller/inboxController';
import {requireAuth} from "../middleware/authMiddleware";

const router = express.Router();

router.post('/', requireAuth, handleInboxPost);

export default router;
