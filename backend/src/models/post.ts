import Post from '../types/post';

export const createPost = async (data: any) => {
  const post = new Post(data);
  return await post.save();
};

export const getAllPosts = async () => {
  return await Post.find().sort({ createdAt: -1 });
};

export const getPostsByActor = async (actorUrl: string) => {
  return await Post.find({ actor: actorUrl }).sort({ createdAt: -1 });
};