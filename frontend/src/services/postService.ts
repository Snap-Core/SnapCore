import { URLS } from "../enums/urls";
import type { Like, Post } from "../types/Post";
import { fetcher } from "../utils/fetcher";
import { getLikesByPost } from "./likeService";

const BASE_MEDIA_URL = URLS.APP;
const BASE_URL = "http://localhost:3000";

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
    [key: string]: unknown;
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
      try {
        likes = await getLikesByPost(postUrl);
      } catch (error) {
        console.error(`Failed to fetch likes for post ${postUrl}`, error);
      }

      const liked = likes.some((like) =>
        like.actor.endsWith(currentUserActor)
      );

      const media = Array.isArray(raw.media)
        ? raw.media.map((item: any) => ({
            url: `${BASE_URL}${item.url.trim()}`,
            type: item.type,
          }))
        : raw.mediaUrl
        ? [
            {
              url: `${BASE_URL}${raw.mediaUrl.trim()}`,
              type: raw.mediaType || "image",
            },
          ]
        : [];

      const username =
        typeof raw.actor === "string" ? raw.actor.split("/").pop() : "unknown";

       let userProfilePic: string | undefined = undefined;

      try {
        const userData = await fetcher(`/users/${username}`);
        if (userData?.profilePic) {
          userProfilePic = `${BASE_MEDIA_URL}${userData.profilePic}`;
        }
      } catch (err) {
        console.warn(`Failed to fetch profile pic for ${username}`, err);
      }

      return {
        id: raw._id,
        text: raw.content,
        media,
        createdAt: raw.createdAt,
        liked,
        likes,
        comments: [],
        user: {
          username,
          displayName: username,
          profilePic: userProfilePic,
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
  const user = await fetcher(`/users/me`);
  const profilePicUrl = `${BASE_URL}${user.user.profilePic}`;

  const newPost: Post = {
    id: raw._id,
    text: raw.content,
    media: Array.isArray(raw.media)
      ? raw.media.map((item: any) => ({
          url: `${BASE_URL}${item.url.trim()}`,
          type: item.type,
        }))
      : raw.mediaUrl
      ? [
          {
            url: `${BASE_URL}${raw.mediaUrl.trim()}`,
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
      profilePic: profilePicUrl,
    },
  };

  return newPost;
};
