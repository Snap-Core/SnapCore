export type Post = {
  id: string;
  text?: string;
  images?: string[];
  createdAt: string;
  user?: {
    username?: string;
    name?: string;
    profilePic?: string;
  };
};
