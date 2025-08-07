import type { PostComment } from "../types/PostComment";
import { fetcher } from "../utils/fetcher";
import { URLS } from "../config/urls";


type RawActivityPubCollection = {
  "@context": string;
  id: string;
  type: "OrderedCollection";
  totalItems: number;
  orderedItems: RawActivityPubCreate[];
};

type RawActivityPubCreate = {
  "@context"?: string;
  id: string;
  type: "Create";
  actor: string;
  published: string;
  to: string[];
  object: RawActivityPubNote;
};

type RawActivityPubNote = {
  id: string;
  type: "Note";
  content: string;
  attributedTo: string;
  published: string;
  inReplyTo?: string;
  attachment?: {
    type: string;
    mediaType: string;
    url: string;
  };
};


const transformActivityPubNote = (note: RawActivityPubNote): PostComment => {
  const username = note.attributedTo.split("/").pop() || "unknown";

  return {
    id: note.id,
    text: note.content,
    inReplyTo: note.inReplyTo || "",
    createdAt: note.published,
    media: note.attachment
      ? [
          {
            url: note.attachment.url.startsWith("http")
              ? note.attachment.url
              : `${URLS.BACKEND_BASE}${note.attachment.url.trim()}`,
            type: note.attachment.mediaType.startsWith("image") ? "image" : "video",
          },
        ]
      : [],
    user: {
      username,
      name: username,
      profilePic: undefined,
    },
  };
};


export const getAllComments = async (): Promise<PostComment[]> => {
  const data: RawActivityPubCollection = await fetcher(`/comments`);
  return data.orderedItems.map((item) => transformActivityPubNote(item.object));
};


export const getCommentsForObject = async (inReplyToUrl: string): Promise<PostComment[]> => {
  const encoded = encodeURIComponent(inReplyToUrl);
  const data: RawActivityPubCollection = await fetcher(`/comments/in-reply-to/${encoded}`);
  return data.orderedItems.map((item) => transformActivityPubNote(item.object));
};


export const getCommentsByActor = async (actorUrl: string): Promise<PostComment[]> => {
  const encoded = encodeURIComponent(actorUrl);
  const data: RawActivityPubCollection = await fetcher(`/comments/actor/${encoded}`);
  return data.orderedItems.map((item) => transformActivityPubNote(item.object));
};


export const createComment = async (params: {
  content: string;
  actor: string;
  inReplyTo: string;
  media?: File[];
}): Promise<PostComment> => {
  const formData = new FormData();
  formData.append("content", params.content);
  formData.append("actor", params.actor);
  formData.append("inReplyTo", params.inReplyTo);

  if (params.media) {
    for (const file of params.media) {
      formData.append("media", file);
    }
  }

  const response: RawActivityPubCreate = await fetcher(`/comments`, {
    method: "POST",
    body: formData,
  });

  return transformActivityPubNote(response.object);
};
