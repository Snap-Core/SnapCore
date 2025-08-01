import express from 'express';
import multer from 'multer';
import path from 'path';
import { createPost, getAllPosts, getPostsByActor } from '../controller/postController';


const router = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ storage }); // storing locally for now, will have a chat with T-Man about cloud storage later

router.post('/', upload.single('media'), createPost);
router.get('/', getAllPosts);
router.get('/actor/:actorUrl', getPostsByActor);

export default router;
