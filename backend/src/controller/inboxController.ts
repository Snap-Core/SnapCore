import { Request, Response } from 'express';
import Post from '../types/post';

export const handleInboxPost = async (req: Request, res: Response) => {
  try {
    const activity = req.body;

    if (activity.type !== 'Create' || !activity.object) {
      return res.status(400).json({ message: 'Only Create activities are supported' });
    }

    const note = activity.object;
    const { content, attributedTo, attachment, published } = note;

    const mediaUrl = attachment?.url || undefined;
    const mediaType = attachment?.type?.toLowerCase() === 'image' ? 'image' :
                      attachment?.type?.toLowerCase() === 'video' ? 'video' : undefined;

    const savedPost = new Post({
      content,
      actor: attributedTo,
      mediaUrl,
      mediaType,
      activityPubObject: activity,
      createdAt: published ? new Date(published) : new Date(),
    });

    await savedPost.save();
    return res.status(202).json({ message: 'Activity received and post created' });

  } catch (err) {
    console.error('Inbox error:', err);
    return res.status(500).json({ message: 'Error processing inbox activity' });
  }
};
