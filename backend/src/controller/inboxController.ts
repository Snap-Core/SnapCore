import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Post from '../types/post';
import Like from '../types/likes';
import Follow from '../types/follow';

const extractActorId = (actorField: string | { [key: string]: any }): string => {
  if (typeof actorField === 'string') return actorField;
  if (actorField?.id) return actorField.id;
  if (actorField?.name) return actorField.name;
  throw new Error('Invalid actor format: cannot extract ID');
};

const sendAcceptFollow = async (
  actorField: string | object,
  object: string,
  followActivityId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const actorId = extractActorId(actorField);

    const actorRes = await fetch(actorId, {
      headers: { Accept: 'application/activity+json' }
    });

    if (!actorRes.ok) {
      return { success: false, error: `Failed to fetch actor: ${actorRes.statusText}` };
    }

    const actorData = await actorRes.json() as { inbox: string };
    const inboxUrl = actorData.inbox;

    if (!inboxUrl) {
      return { success: false, error: 'Follower actor has no inbox' };
    }

    const acceptActivity = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: `https://snapcore.subspace/activities/${uuidv4()}`,
      type: 'Accept',
      actor: object,
      object: {
        id: followActivityId,
        type: 'Follow',
        actor: actorId,
        object
      }
    };

    const res = await fetch(inboxUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/activity+json' },
      body: JSON.stringify(acceptActivity)
    });

    if (!res.ok) {
      return { success: false, error: `Failed to send Accept: ${res.statusText}` };
    }

    return { success: true };

  } catch (err) {
    return { success: false, error: String(err) };
  }
};

export const handleInboxPost = async (req: Request, res: Response) => {
  try {
    const activity = req.body;
    if (!activity.type || !activity.actor || !activity.object) {
      return res.status(400).json({ message: 'Invalid ActivityPub object' });
    }

    let actor: string;
    try {
      actor = extractActorId(activity.actor);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid actor format' });
    }

    if (activity.type === 'Create' && activity.object?.type === 'Note') {
      const note = activity.object;
      const { content, attributedTo, attachment, published } = note;

      const mediaUrl = attachment?.url || undefined;
      const mediaType = attachment?.type?.toLowerCase() === 'image' ? 'image' :
                        attachment?.type?.toLowerCase() === 'video' ? 'video' : undefined;

      const post = new Post({
        content,
        actor,
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
      const objectField = activity.object;

      const objectId =
        typeof objectField === 'string'
          ? objectField
          : objectField?.id;

      if (!objectId) {
        return res.status(400).json({ message: 'Like activity missing object ID' });
      }

      const existingPost = await Post.findOne({ 'activityPubObject.object.id': objectId });
      if (!existingPost) {
        return res.status(404).json({ message: 'Cannot like non-existent post' });
      }

      const alreadyLiked = await Like.findOne({ actor, object: objectId });
      if (alreadyLiked) {
        return res.status(409).json({ message: 'Actor has already liked this post' });
      }

      const like = new Like({
        actor,
        object: objectId,
        activityPubObject: activity
      });

      await like.save();
      return res.status(202).json({ message: 'Like received and recorded' });
    }

    if (activity.type === 'Undo' && activity.object?.type === 'Like') {
      const objectUrl = activity.object.object?.id || activity.object.object;

      if (!objectUrl) {
        return res.status(400).json({ message: 'Invalid Undo Like format' });
      }

      const postExists = await Post.exists({ 'activityPubObject.object.id': objectUrl });
      if (!postExists) {
        return res.status(404).json({ message: 'Post does not exist' });
      }

      const result = await Like.findOneAndDelete({ actor, object: objectUrl });
      if (result) {
        return res.status(202).json({ message: 'Like undone successfully' });
      } else {
        return res.status(410).json({ message: 'Like was already deleted or never existed' });
      }
    }

    if (activity.type === 'Follow') {
      const object = activity.object;
      if (!object) {
        return res.status(400).json({ message: 'Missing object in Follow activity' });
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

      const acceptResult = await sendAcceptFollow(activity.actor, object, activity.id);
      if (!acceptResult.success) {
        return res.status(500).json({ message: `Failed to send Accept: ${acceptResult.error}` });
      }

      return res.status(202).json({ message: 'Follow recorded and Accept sent' });
    }

    if (activity.type === 'Undo' && activity.object?.type === 'Follow') {
      const object = activity.object.object;
      if (!object) {
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
    return res.status(500).json({ message: 'Error processing inbox activity', error: String(err) });
  }
};
