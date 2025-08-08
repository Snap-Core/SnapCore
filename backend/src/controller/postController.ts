import { Request, Response } from 'express';
import * as PostRepo from '../models/post';
import path from 'path';
import { getUploadedFileUrl } from '../utils/getFileUrl';
import { fetchExternalUser, fetchExternalUserOutbox } from '../services/federatedSearchService';
import Post from "../types/post";
import dotenv from "dotenv";
import {Types} from "mongoose";
import { URLS } from '../config/urls';

dotenv.config();

const generateActivityPubNote = async (
  actor: string,
  content: string,
  mediaUrl?: string,
  mediaType?: string
) => {
  const postCount = await Post.countDocuments();
  const id = `${actor}/post/${postCount + 1}`;
  
  const note: any = {
    "@context": "https://www.w3.org/ns/activitystreams",
    type: "Create",
    id,
    actor,
    published: new Date().toISOString(),
    to: ["https://www.w3.org/ns/activitystreams#Public"],
    object: {
      id: id,
      type: "Note",
      content,
      attributedTo: actor,
      published: new Date().toISOString(),
      to: ["https://www.w3.org/ns/activitystreams#Public"]
    }
  };

  if (mediaUrl && mediaType) {
    note.object.attachment = {
      type: mediaType === 'image' ? 'Image' : 'Video',
      mediaType: mediaType === 'image' ? 'image/jpeg' : 'video/mp4',
      url: `${URLS.BACKEND_BASE}/api${mediaUrl}`
    };
  }

  return note;
};

export const createPost = async (req: Request, res: Response) => {
  try {
    const { content, actor } = req.body;
    let mediaUrl, mediaType;

    if (!content || !actor) {
      return res.status(400).json({ message: 'Missing required fields: content or actor' });
    }

    if (req.file) {
      mediaUrl = getUploadedFileUrl(req) || '';
      const ext = path.extname(req.file.originalname).toLowerCase();
      mediaType = ['.jpg', '.jpeg', '.png', '.gif'].includes(ext) ? 'image' : 'video';
    }

    const activityPubObject = await generateActivityPubNote(actor, content, mediaUrl, mediaType);
    const id = `${ activityPubObject.id}/activity`;
    const savedPost = await PostRepo.createPost({
      id,
      content,
      actor,
      mediaUrl,
      mediaType,
      object: activityPubObject,
    });

    res.status(201).json(savedPost);
  } catch (err) {
    res.status(500).json({ message: 'Could not create a post' });
  }
};

export const getAllPosts = async (_req: Request, res: Response) => {
  try {
    const posts = await PostRepo.getAllPosts();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch posts' });
  }
};

const getActorDetails = (actorUrl: string): { username: string, domain: string, isFederated: boolean } => {
  if (actorUrl.includes("@")) {
    let username = actorUrl.substring(0, actorUrl.lastIndexOf("@"));
    const domain = actorUrl.substring(actorUrl.lastIndexOf("@") + 1);
    if (username.startsWith("@")) {
      username = username.substring(1);
    }
    const ourDomain = new URL(URLS.BACKEND_BASE).hostname;
    return { username, domain, isFederated: (!!domain && domain != ourDomain) };
  } else {
    return { username: actorUrl, domain: "", isFederated: false }
  }
}

export const getPostsByActor = async (req: Request, res: Response) => {
  try {
    const actorUrl = decodeURIComponent(req.params.actorUrl);

    const { username, domain, isFederated } = getActorDetails(actorUrl);

    if (isFederated) {
      const user = await fetchExternalUser(username, domain);
      const outbox = await fetchExternalUserOutbox(user?.outbox || "");
      const posts: any[] = [];

      for (const item of outbox.items) {
        posts.push({
          content: item.object.content,
          actor: item.actor,
          activityPubObject: item.object,
          createdAt: item.object.published,
        }
        );
      }

      if (!posts.length) {
        return res.status(404).json({ message: 'No posts found for this actor' });
      } else {
        res.json(posts);
        return;
      }
    }

    const posts = await PostRepo.getPostsByActor(actorUrl);

    if (!posts.length) {
      return res.status(404).json({ message: 'No posts found for this actor' });
    }

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Error Could not fetch posts by actor' });
  }
};

export const getOutboxResponse = async (req: Request, res: Response) => {

  const actorUrl = decodeURIComponent(req.params.userUrl);

  const {page, min_id, max_id} = req.query as {page: string, min_id: string, max_id: string};
  let posts;

  if (!page && !min_id && !max_id) {
    return res.status(200).json(await getInitialOutboxResponseValues(actorUrl));
  } else if (page && !min_id && !max_id) {

    posts = await Post.find({
      actor: actorUrl
    })
      .sort({ _id: -1 })
      .limit(10);

  } else if (min_id) {

    posts = await Post.find({
      actor: actorUrl,
      _id: { $gt: new Types.ObjectId(min_id) }
    })
      .sort({ _id: -1 })
      .limit(10);

  } else if (max_id) {

    posts = await Post.find({
      actor: actorUrl,
      _id: { $lt: new Types.ObjectId(max_id) }
    })
      .sort({ _id: -1 })
      .limit(10);

  }

  posts!.forEach((post : any) => {
    post.id = `${actorUrl}/post/${post._id}/activity`;

    post.object = post.object || {};

    post.object.id = `${actorUrl}/post/${post._id}`;
  })

    return res.status(200).json({posts});

}

export const getInitialOutboxResponseValues = async (actorUrl : string) => {

  const [last] : any = await Post.find({ actor: actorUrl })
    .sort({ 'object.published': 1 })
    .limit(1)
    .select('_id');

  const totalItems = await Post.countDocuments({ actor: actorUrl });

  return {
    totalItems,
    oldestPostId: last._id.toString(),
  };

}
