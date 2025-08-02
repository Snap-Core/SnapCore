export type Comment = {
  id: string;
  text: string;
  user: string;
};

export type Post = {
  id: string;
  text?: string;
  images?: string[];
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
