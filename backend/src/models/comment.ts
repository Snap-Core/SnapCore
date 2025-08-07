import Comment from '../types/comment';

export const createComment = async (data: any) => {
  const comment = new Comment(data);
  return await comment.save();
};

export const getAllComments = async () => {
  return await Comment.find().sort({ createdAt: -1 });
};

export const getCommentsByActor = async (actorUrl: string) => {
  return await Comment.find({ actor: actorUrl }).sort({ createdAt: -1 });
};

export const getCommentsForObject = async (inReplyTo: string) => {
  return await Comment.find({ inReplyTo }).sort({ createdAt: 1 });
};
