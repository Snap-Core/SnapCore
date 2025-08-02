import express from 'express';
import Like from '../types/likes';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const likes = await Like.find();
    res.json(likes);
  } catch (err) {
    console.error('Error fetching all likes:', err);
    res.status(500).json({ message: 'Error fetching likes' });
  }
});

router.get('/:postUrl', async (req, res) => {
  try {
    const rawParam = req.params.postUrl;
    const postUrl = decodeURIComponent(rawParam); 

    const likes = await Like.find({ object: postUrl });
    res.json(likes);
  } catch (err) {
    console.error('Error fetching likes for post:', err);
    res.status(500).json({ message: 'Error fetching likes for post' });
  }
});

router.get('/:postUrl/count', async (req, res) => {
  try {
    const rawParam = req.params.postUrl;
    const postUrl = decodeURIComponent(rawParam);

    const likeCount = await Like.countDocuments({ object: postUrl });

    res.json({ post: postUrl, likeCount });
  } catch (err) {
    console.error('Error counting likes for post:', err);
    res.status(500).json({ message: 'Error counting likes for post' });
  }
});

router.get('/:postUrl/actors', async (req, res) => {
  try {
    const rawParam = req.params.postUrl;
    const postUrl = decodeURIComponent(rawParam);

    const likes = await Like.find({ object: postUrl }).select('actor -_id');

    const actors = likes.map(like => like.actor);
    res.json({ post: postUrl, actors });
  } catch (err) {
    console.error('Error fetching like actors:', err);
    res.status(500).json({ message: 'Error fetching like actors' });
  }
});

export default router;
