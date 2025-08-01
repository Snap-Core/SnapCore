import express from 'express';
import multer from 'multer';
import { createPost, getAllPosts } from '../controller/postController';

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // store locally for now

router.post('/', upload.single('media'), createPost);
router.get('/', getAllPosts);

export default router;
