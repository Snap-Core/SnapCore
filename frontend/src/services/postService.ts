import type { Like, Post } from "../types/Post";
import { fetcher } from "../utils/fetcher";
import { getLikesByPost } from "./likeService";
import { URLS, buildProfilePicUrl } from "../config/urls";

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
  const rawPosts: RawPost[] = await fetcher(`/posts`);

  const posts = await Promise.all(
    rawPosts.map(async (raw): Promise<Post | null> => {
      const postUrl = raw.activityPubObject?.id;
      if (!postUrl) {
        console.warn("Skipping post with missing activityPubObject:", raw._id);
        return null;
      }
      let likes: Like[] = [];
      let likesCount = 0;
      try {
        const fetchedLikes = await getLikesByPost(postUrl);
        if (Array.isArray(fetchedLikes)) {
          likes = fetchedLikes;
          likesCount = likes.length;
        } else if (fetchedLikes && Array.isArray(fetchedLikes.likes)) {
          likes = fetchedLikes.likes;
          likesCount = fetchedLikes.totalCount || likes.length;
        } else {
          likes = [];
          likesCount = 0;
        }
      } catch (error) {
        console.error(`Failed to fetch likes for post ${postUrl}`, error);
      }

      const liked = likes.some((like) =>
        like.actor.endsWith(currentUserActor)
      );

      const media = Array.isArray(raw.media)
        ? raw.media.map((item) => ({
            url: `${URLS.BACKEND_BASE}${item.url.trim()}`,
            type: (item.type === "video" ? "video" : "image") as "image" | "video",
          }))
        : raw.mediaUrl
        ? [
            {
              url: `${URLS.BACKEND_BASE}${raw.mediaUrl.trim()}`,
              type: (raw.mediaType === "video" ? "video" : "image") as "image" | "video",
            },
          ]
        : [];

      const username = typeof raw.actor === "string" 
        ? (raw.actor.includes("/") ? raw.actor.split("/").pop() : raw.actor)
        : "unknown";

      let userProfilePic: string | undefined = undefined;

      try {
        const userData = await fetcher(`/users/${username}`);
        if (userData?.profilePic) {
          userProfilePic = `${URLS.BACKEND_BASE}${userData.profilePic}`;
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
        likesCount,
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

  const filteredPosts = posts.filter((post): post is Post => post !== null);
  return filteredPosts;
};


export const getPostsByActor = async (actorUrl: string, currentUserActor: string = "") => {
  const encodedActor = encodeURIComponent(actorUrl);
  const rawPosts: RawPost[] = await fetcher(`/posts/actor/${encodedActor}`);

  const posts = await Promise.all(
    rawPosts.map(async (raw): Promise<Post | null> => {
      const postUrl = raw.activityPubObject?.id;
      if (!postUrl) {
        console.warn("Skipping post with missing activityPubObject:", raw._id);
        return null;
      }

      let likes: Like[] = [];
      let likesCount = 0;
      try {
        const fetchedLikes = await getLikesByPost(postUrl);
        if (Array.isArray(fetchedLikes)) {
          likes = fetchedLikes;
          likesCount = likes.length;
        } else if (fetchedLikes && Array.isArray(fetchedLikes.likes)) {
          likes = fetchedLikes.likes;
          likesCount = fetchedLikes.totalCount || likes.length;
        } else {
          likes = [];
          likesCount = 0;
        }
      } catch (error) {
        console.error(`Failed to fetch likes for post ${postUrl}`, error);
      }

      const liked = likes.some((like) => like.actor.endsWith(currentUserActor));

      const media = Array.isArray(raw.media)
        ? raw.media.map((item) => ({
            url: `${URLS.BACKEND_BASE}${item.url.trim()}`,
            type: (item.type === "video" ? "video" : "image") as "image" | "video",
          }))
        : raw.mediaUrl
        ? [
            {
              url: `${URLS.BACKEND_BASE}${raw.mediaUrl.trim()}`,
              type: (raw.mediaType === "video" ? "video" : "image") as "image" | "video",
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
        likesCount,
        comments: [],
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
  const profilePicUrl = buildProfilePicUrl(user.user.profilePic);
  
  const newPost: Post = {
    id: raw._id,
    text: raw.content,
    media: Array.isArray(raw.media)
      ? raw.media.map((item) => ({
          url: `${URLS.BACKEND_BASE}${item.url.trim()}`,
          type: (item.type === "video" ? "video" : "image") as "image" | "video",
        }))
      : raw.mediaUrl
      ? [
          {
            url: `${URLS.BACKEND_BASE}${raw.mediaUrl.trim()}`,
            type: (raw.mediaType === "video" ? "video" : "image") as "image" | "video",
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
