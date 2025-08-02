import { Request, Response } from 'express';
import Post from '../types/post';
import Like from '../types/likes';
import Follow from '../types/follow';

export const handleInboxPost = async (req: Request, res: Response) => {
  try {
    const activity = req.body;

    if (!activity.type || !activity.actor || !activity.object) {
      return res.status(400).json({ message: 'Invalid ActivityPub object' });
    }

    if (activity.type === 'Create' && activity.object?.type === 'Note') {
      const note = activity.object;
      const { content, attributedTo, attachment, published } = note;

      const mediaUrl = attachment?.url || undefined;
      const mediaType = attachment?.type?.toLowerCase() === 'image' ? 'image' :
                        attachment?.type?.toLowerCase() === 'video' ? 'video' : undefined;

      const post = new Post({
        content,
        actor: attributedTo,
        mediaUrl,
        mediaType,
        activityPubObject: activity,
        createdAt: published ? new Date(published) : new Date(),
        isFederated: true
      });

      await post.save();
      return res.status(202).json({ message: 'Create activity received and post saved' });
    }
    

    if (activity.type === 'Like') {
      const objectId = activity.object.split('#')[0];

      const existingPost = await Post.findOne({ 'activityPubObject.id': objectId });
      if (!existingPost) {
        return res.status(404).json({ message: 'Cannot like non-existent post' });
      }

      const alreadyLiked = await Like.findOne({ actor: activity.actor, object: objectId });
      if (alreadyLiked) {
        return res.status(409).json({ message: 'Actor has already liked this post' });
      }
      const like = new Like({
        actor: activity.actor,
        object: objectId,
        activityPubObject: activity
      });

        await like.save();
        return res.status(202).json({ message: 'Like received and recorded' });
    }

    if (activity.type === 'Undo' && activity.object?.type === 'Like') {
     const actor = activity.actor;
     const objectUrl = activity.object.object?.split('#')[0]; 

     if (!actor || !objectUrl) {
      return res.status(400).json({ message: 'Invalid Undo Like format' });
     }
     
      const postExists = await Post.exists({ 'activityPubObject.id': objectUrl });
      if (!postExists) {
       return res.status(404).json({ message: 'Post does not exist' });
     }
     try {
    const result = await Like.findOneAndDelete({ actor, object: objectUrl });

    if (result) {
      return res.status(202).json({ message: 'Like undone successfully' });
    } else {
      return res.status(410).json({ message: 'Like was already deleted or never existed' });
    }
  } catch (err) {
    console.error('Error during Undo Like:', err);
    return res.status(500).json({ message: 'Error during Undo Like' });
  }
}

    if (activity.type === 'Follow') {
      const { actor, object } = activity;

      if (!actor || !object) {
        return res.status(400).json({ message: 'Missing actor or object in Follow activity' });
      }

      const alreadyFollowing = await Follow.findOne({ actor, object });
      if (alreadyFollowing) {
        return res.status(409).json({ message: 'Actor already follows this user' });
      }

      const follow = new Follow({
        actor,
        object,
        activityPubObject: activity
      });

      await follow.save();
      return res.status(202).json({ message: 'Follow recorded successfully' });
    }

    if (activity.type === 'Undo' && activity.object?.type === 'Follow') {
      const actor = activity.actor;
      const object = activity.object.object;

      if (!actor || !object) {
        return res.status(400).json({ message: 'Invalid Undo Follow format' });
      }

      const result = await Follow.findOneAndDelete({ actor, object });
      if (result) {
        return res.status(202).json({ message: 'Follow undone successfully' });
      } else {
        return res.status(410).json({ message: 'Follow was already deleted or never existed' });
      }
    }

    return res.status(400).json({ message: 'Unsupported activity type' });


  } catch (err) {
    console.error('Inbox error:', err);
    return res.status(500).json({ message: 'Error processing inbox activity' });
  }
};