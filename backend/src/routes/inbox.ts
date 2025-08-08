import express from 'express';
import { handleInboxPost } from '../controller/inboxController';
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post('/', authMiddleware, handleInboxPost);

export default router;
