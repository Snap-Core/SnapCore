import express from 'express';
import { createPost, getAllPosts, getPostsByActor } from '../controller/postController';
import { upload } from '../middleware/uploadMiddleware';


const router = express.Router();

router.post('/', upload.single('media'), createPost);
router.get('/', getAllPosts);
router.get('/actor/:actorUrl', getPostsByActor);

export default router;
