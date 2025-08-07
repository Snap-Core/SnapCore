import { Request, Response } from 'express';
import * as PostRepo from '../models/post';
import path from 'path';
import { getUploadedFileUrl } from '../utils/getFileUrl';
import { fetchExternalUser, fetchExternalUserOutbox, searchFederatedUsers } from '../services/federatedSearchService';

const generateActivityPubNote = (
  actor: string,
  content: string,
  mediaUrl?: string,
  mediaType?: string
) => {
  const id = `https://snapcore.subspace/posts/${Date.now()}-${Math.floor(Math.random() * 1000)}`;
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
      url: `https://snapcore.subspace.site/api${mediaUrl}`
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

    const activityPubObject = generateActivityPubNote(actor, content, mediaUrl, mediaType);
    const savedPost = await PostRepo.createPost({
      content,
      actor,
      mediaUrl,
      mediaType,
      activityPubObject,
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
    const ourDomain = "snapcore.subspace.su";
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

