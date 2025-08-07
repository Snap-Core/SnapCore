export type PostComment = {
  id: string;
  text: string;
  inReplyTo: string;
  media: { url: string; type: string }[];
  createdAt: string;
  user: {
    username: string;
    name: string;
    profilePic?: string;
  };
};
