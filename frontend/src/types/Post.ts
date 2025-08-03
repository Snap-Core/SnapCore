export type Comment = {
  id: string;
  text: string;
  user: string;
};

export type MediaItem = {
  url: string;
  type: "image" | "video";
};

export type Post = {
  id: string;
  text?: string;
  media?: MediaItem[];
  createdAt: string;
  likes?: number;
  liked?: boolean;
  comments?: Comment[];
  user?: {
    username?: string;
    name?: string;
    profilePic?: string;
  };
};
