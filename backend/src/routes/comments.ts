import express from 'express';
import { createComment, getAllComments, getCommentsByActor, getCommentsForObject } from '../controller/commentsController';
import { upload } from '../middleware/uploadMiddleware';

const router = express.Router();

router.post('/', upload.single('media'), createComment);
router.get('/', getAllComments);
router.get('/actor/:actorUrl', getCommentsByActor);
router.get('/in-reply-to/:inReplyTo', getCommentsForObject);

export default router;
