import { Request, Response } from 'express';
import * as CommentRepo from '../models/comment';
import path from 'path';
import { getUploadedFileUrl } from '../utils/getFileUrl';

const generateActivityPubComment = (
  actor: string,
  content: string,
  inReplyTo: string,
  mediaUrl?: string,
  mediaType?: string
) => {
  const id = `https://mastinstatok.local/comments/${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const published = new Date().toISOString();

  const note: any = {
    "@context": "https://www.w3.org/ns/activitystreams",
    type: "Create",
    id,
    actor,
    published,
    to: ["https://www.w3.org/ns/activitystreams#Public"],
    object: {
      id,
      type: "Note",
      content,
      inReplyTo,
      attributedTo: actor,
      published,
      to: ["https://www.w3.org/ns/activitystreams#Public"],
      context: inReplyTo // Optional: enables threading
    }
  };

  if (mediaUrl && mediaType) {
    note.object.attachment = {
      type: mediaType === 'image' ? 'Image' : 'Video',
      mediaType: mediaType === 'image' ? 'image/jpeg' : 'video/mp4',
      url: `https://your-domain.com${mediaUrl}`
    };
  }

  return note;
};

export const createComment = async (req: Request, res: Response) => {
  try {
    const { content, actor, inReplyTo } = req.body;
    let mediaUrl, mediaType;

    if (!content || !actor || !inReplyTo) {
      return res.status(400).json({ message: 'Missing required fields: content, actor, or inReplyTo' });
    }

    if (req.file) {
      mediaUrl = getUploadedFileUrl(req) || '';
      const ext = path.extname(req.file.originalname).toLowerCase();
      mediaType = ['.jpg', '.jpeg', '.png', '.gif'].includes(ext) ? 'image' : 'video';
    }

    const activityPubObject = generateActivityPubComment(actor, content, inReplyTo, mediaUrl, mediaType);
    const savedComment = await CommentRepo.createComment({
      content,
      actor,
      inReplyTo,
      mediaUrl,
      mediaType,
      activityPubObject,
    });

    res.status(201).json(activityPubObject);
  } catch (err) {
    res.status(500).json({ message: 'Could not create comment' });
  }
};

export const getAllComments = async (_req: Request, res: Response) => {
  try {
    const comments = await CommentRepo.getAllComments();
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch comments' });
  }
};

export const getCommentsByActor = async (req: Request, res: Response) => {
  try {
    const actorUrl = decodeURIComponent(req.params.actorUrl);
    const comments = await CommentRepo.getCommentsByActor(actorUrl);

    if (!comments.length) {
      return res.status(404).json({ message: 'No comments found for this actor' });
    }

    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch comments by actor' });
  }
};

export const getCommentsForObject = async (req: Request, res: Response) => {
  try {
    const inReplyTo = decodeURIComponent(req.params.inReplyTo);
    const comments = await CommentRepo.getCommentsForObject(inReplyTo);

    res.json({
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "OrderedCollection",
      id: `https://your-domain.com/objects/${encodeURIComponent(inReplyTo)}/replies`,
      totalItems: comments.length,
      orderedItems: comments.map(c => c.activityPubObject)
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch comments for object' });
  }
};
