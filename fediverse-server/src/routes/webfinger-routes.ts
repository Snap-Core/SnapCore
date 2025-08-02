import express from 'express';
import { handleWebFinger } from '../controllers/webfinger-controller';

const router = express.Router();

router.get('/.well-known/webfinger', handleWebFinger);

export default router;
