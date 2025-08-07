import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Post } from "../../types/Post";
import type { PostComment } from "../../types/PostComment";
import {
  getCommentsForObject,
  createComment,
} from "../../services/commentService";
import { getAllPosts } from "../../services/postService";
import { useAuth } from "../../auth/useAuth";
import genericProfilePic from "../../assets/generic-profile-p.jpg";
import { formatRelativeTime } from "../../utils/timeUtils";
import "../Feed/Feed.css";

export const PostDetailsPage = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAllPosts(currentUser?.username||"").then((posts) => {
      const matched = posts.find((p) => p.id === id);
      if (matched) setPost(matched);
    });

    getCommentsForObject(id!).then((data) => {
      setComments(data);
      setLoading(false);
    });
  }, [id]);

  const handleLike = () => {
    if (!post) return;
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || !currentUser || !post) return;

    const newComment = await createComment({
      content: commentText.trim(),
      actor: currentUser.username || "", 
      inReplyTo: post.id,
    });

    setComments((prev) => [...prev, newComment]);
    setCommentText("");
  };

  if (loading || !post)
    return <div className="feed-loading">Loading post...</div>;

  return (
    <div className="layout-container">
      <div className="left-sidebar">
        <div className="user-card">
          <img
            src={currentUser?.profilePic || genericProfilePic}
            alt="avatar"
            className="user-avatar"
          />
          <div className="user-info">
            <strong>{currentUser?.username}</strong>
            <p>{currentUser?.displayName || "@" + currentUser?.username}</p>
          </div>
        </div>

        <div className="comment-input-box">
          <h4>Leave a comment</h4>
          <textarea
            className="comment-input"
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={6}
          />
          <button
            className="comment-submit-button"
            onClick={handlePostComment}
            disabled={!commentText.trim()}
          >
            Submit
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="post-details-container">
          <div className="main-post-card">
            <div className="post-header">
              <img
                src={post.user?.profilePic || genericProfilePic}
                alt="avatar"
                className="post-avatar"
              />
              <div className="post-meta">
                <strong className="post-username">{post.user?.username}</strong>
                <span className="post-time">
                  {formatRelativeTime(post.createdAt)}
                </span>
              </div>
            </div>

            <div className="details-post-content">{post.text}</div>

            {Array.isArray(post.media) && post.media.length > 0 && (
              <div className="post-media">
                {post.media.map((media, idx) =>
                  media.type === "video" ? (
                    <video key={idx} className="post-video" controls>
                      <source src={media.url} type="video/mp4" />
                    </video>
                  ) : (
                    <img
                      key={idx}
                      className="post-image"
                      src={media.url}
                      alt={`media-${idx}`}
                    />
                  )
                )}
              </div>
            )}

            <div className="post-actions">
              <button onClick={handleLike} className="icon-button">
                {post.liked ? "❤️" : "🤍"} {post.liked || 0}
              </button>
            </div>
          </div>


          <div className="comments-section">

            {comments.length === 0 && (
              <p className="no-comments">No comments yet.</p>
            )}

            <div className="comments-list">
              {comments.map((comment) => (
                <div key={comment.id} className="comment-card">
                  <img
                    src={comment.user.profilePic || genericProfilePic}
                    alt="avatar"
                    className="comment-avatar"
                  />
                  <div className="comment-body">
                    <strong className="comment-username">
                      {comment.user.username}
                    </strong>
                    <p className="comment-text">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="right-panel"></div>
    </div>
  );
};
