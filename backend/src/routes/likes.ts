import express from 'express';
import { LikesController } from '../controller/likesController';

const router = express.Router();

router.post('/', LikesController.createLike);

router.delete('/', LikesController.removeLike);

router.get('/:postUrl', LikesController.getLikesByPost);

router.get('/check/:actor/:postUrl', LikesController.checkUserLike);

export default router;
