import express from 'express';
import path from 'path';
import {createPost, getAllPosts, getOutboxResponse, getPostsByActor} from '../controller/postController';
import { upload } from '../middleware/uploadMiddleware';


const router = express.Router();

router.post('/', upload.single('media'), createPost);
router.get('/', getAllPosts);
router.get('/actor/:actorUrl', getPostsByActor);
router.get('/:userUrl', getOutboxResponse);

export default router;
