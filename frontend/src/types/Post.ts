export type Comment = {
  id: string;
  text: string;
  user: string;
};

export type MediaItem = {
  url: string;
  type: "image" | "video";
};

export type Like = {
  actor: string;
  object?: string;
  activityPubObject: object;
  createdAt: string;
};

export type Post = {
  id: string;
  text?: string;
  media?: MediaItem[];
  createdAt: string;
  likes?: Like[];
  liked?: boolean;
  comments?: Comment[];
  user?: {
    username?: string;
    displayName?: string;
    profilePic?: string;
  };
  activityPubObject?: {
    id: string;
    [key: string]: any;
  };
};
