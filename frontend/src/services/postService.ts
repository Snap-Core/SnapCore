import type { Like, Post } from "../types/Post";
import { fetcher } from "../utils/fetcher";
import { getLikesByPost } from "./likeService";
import { getCommentsForObject } from "./commentService";
import type { PostComment } from "../types/PostComment"; 

const BASE_MEDIA_URL = "http://localhost:3000";

type RawPost = {
  _id: string;
  content: string;
  createdAt: string;
  actor: string;
  media?: { url: string; type: string }[];
  mediaUrl?: string;
  mediaType?: string;
  activityPubObject?: {
    id: string;
    [key: string]: any;
  };
};

export const getAllPosts = async (
  currentUserActor: string
): Promise<Post[]> => {
  const encodedActor = encodeURIComponent(currentUserActor);

  const rawPosts: RawPost[] = await fetcher(`/posts?actor=${encodedActor}`);

  const posts = await Promise.all(
    rawPosts.map(async (raw): Promise<Post | null> => {
      const postUrl = raw.activityPubObject?.id;
      if (!postUrl) {
        console.warn("Skipping post with missing activityPubObject:", raw._id);

        return null;
      }

      let likes: Like[] = [];
      let comments: PostComment[] = []; 

      try {
        likes = await getLikesByPost(postUrl);
        comments = await getCommentsForObject(postUrl);
      } catch (error) {
        console.error(`Failed to fetch data for post ${postUrl}`, error);
      }

      const liked = likes.some((like) => like.actor.endsWith(currentUserActor));

      const media = Array.isArray(raw.media)
        ? raw.media.map((item: any) => ({
            url: `${BASE_MEDIA_URL}${item.url.trim()}`,
            type: item.type,
          }))
        : raw.mediaUrl
        ? [
            {
              url: `${BASE_MEDIA_URL}${raw.mediaUrl.trim()}`,
              type: raw.mediaType || "image",
            },
          ]
        : [];

      const username =
        typeof raw.actor === "string" ? raw.actor.split("/").pop() : "unknown";

      return {
        id: raw._id,
        text: raw.content,
        media,
        createdAt: raw.createdAt,
        liked,
        likes,
        comments,
        user: {
          username,
          displayName: username,
          profilePic: undefined,
        },
        activityPubObject: raw.activityPubObject!,
      };
    })
  );

  return posts.filter((post): post is Post => post !== null);
};

export const getPostsByActor = async (actorUrl: string) => {
  const encoded = encodeURIComponent(actorUrl);

  const res = await fetch(`/posts/actor/${encoded}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch posts for actor: ${actorUrl}`);
  }
  return await res.json();
};

export const createPost = async (params: {
  content: string;
  actor: string;
  media?: File[];
}): Promise<Post> => {
  const formData = new FormData();
  formData.append("content", params.content);
  formData.append("actor", params.actor);
  if (params.media) {
    for (const file of params.media) {
      formData.append("media", file);
    }
  }

  const response = await fetcher(`/posts`, {
    method: "POST",
    body: formData,
  });

  const raw: RawPost = await response;

  const newPost: Post = {
    id: raw._id,
    text: raw.content,
    media: Array.isArray(raw.media)
      ? raw.media.map((item: any) => ({
          url: `${BASE_MEDIA_URL}${item.url.trim()}`,
          type: item.type,
        }))
      : raw.mediaUrl
      ? [
          {
            url: `${BASE_MEDIA_URL}${raw.mediaUrl.trim()}`,
            type: raw.mediaType || "image",
          },
        ]
      : [],
    createdAt: raw.createdAt,
    liked: false,
    likes: [],
    comments: [],
    user: {
      username:
        typeof raw.actor === "string" ? raw.actor.split("/").pop()! : "unknown",
      displayName:
        typeof raw.actor === "string" ? raw.actor.split("/").pop()! : "Unknown",
      profilePic: undefined,
    },
  };

  return newPost;
};