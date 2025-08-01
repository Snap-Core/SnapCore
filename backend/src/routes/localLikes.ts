import express from 'express';
import Like from '../types/likes';
import Post from '../types/post';

const router = express.Router();

router.post('/', async (req, res) => {
  const { actor, object } = req.body;
  const objectUrl = object?.split('#')[0];

  if (!actor || !objectUrl) {
    return res.status(400).json({ message: 'Missing actor or object URL' });
  }

  const post = await Post.findOne({ 'activityPubObject.id': objectUrl });
  if (!post) {
    return res.status(404).json({ message: 'Post does not exist' });
  }

  try {
    const like = new Like({
      actor,
      object: objectUrl,
      activityPubObject: {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Like',
        actor,
        object: objectUrl,
      },
    });

    await like.save();
    res.status(201).json({ message: 'Post liked' });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Already liked' });
    }
    console.error('Error liking post:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/', async (req, res) => {
  const { actor, object } = req.body;
  const objectUrl = object?.split('#')[0];

  if (!actor || !objectUrl) {
    return res.status(400).json({ message: 'Missing actor or object URL' });
  }

  const post = await Post.findOne({ 'activityPubObject.id': objectUrl });
  if (!post) {
    return res.status(404).json({ message: 'Post does not exist' });
  }

  const deleted = await Like.findOneAndDelete({ actor, object: objectUrl });

  if (deleted) {
    return res.status(202).json({ message: 'Like removed' });
  } else {
    return res.status(410).json({ message: 'Like not found' });
  }
});


export default router;
