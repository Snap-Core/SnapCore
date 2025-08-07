import express from 'express';
import { handleInboxPost } from '../controller/inboxController';
import { verifyHttpSignature } from '../middleware/verifyHttpSignature';

const router = express.Router();

router.post('/', verifyHttpSignature, handleInboxPost);

export default router;
