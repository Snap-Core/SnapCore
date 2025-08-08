import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Feed.css";
import type { Post } from "../../types/Post";
import { formatRelativeTime } from "../../utils/timeUtils";
import genericProfilePic from "../../assets/generic-profile-p.jpg";
import { getAllPosts, getPostsByActor } from "../../services/postService";
import { useAuth } from "../../auth/useAuth";
import { v4 as uuidv4 } from "uuid";
import { useFollow } from "../../components/FollowContext";
import { useToast } from "../../components/ToastContext";
import { useNavigate } from "react-router-dom";
import { PostOriginBadge } from "../../components/PostOriginBadge";
import { useLikes } from "../../hooks/useLikes";
import DOMPurify from "dompurify";
import { buildUserUrl } from "../../config/urls";

type FeedProps = {
  username?: string;
  reloadKey?: number;
};

export const Feed = ({ username, reloadKey }: FeedProps) => {
  const { user: currentUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const { followedUsers, toggleFollow } = useFollow();
  const isFollowing = (username: string) => followedUsers.has(username);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const likesHook = useLikes();
  
  useEffect(() => {
    setLoading(true);
    setError(false);

    if (username) {
      getPostsByActor(username, currentUser?.username || "")
        .then((fetchedPosts) => {
          setPosts(fetchedPosts);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
          setError(true);
        });
    } else {
      getAllPosts(currentUser?.username || "")
        .then((fetchedPosts) => {
          setPosts(fetchedPosts);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
          setError(true);
        });
    }
  }, [currentUser?.username, reloadKey, username]);

  useEffect(() => {
    if (showComments) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
    return () => document.body.classList.remove("no-scroll");
  }, [showComments]);

  const handleFollow = async (targetUsername?: string) => {
    if (!targetUsername) return;
    await toggleFollow(targetUsername);
  };

  const handleLike = async (postId: string) => {
    const actorUrl = currentUser?.username
      ? buildUserUrl(currentUser.username):
      null;

    if (!actorUrl) {
      showToast(`Please log in to like posts`, "warning");
      return;
    }

    const post = posts.find((p) => p.id === postId);
    const objectUrl = post?.activityPubObject?.id;

    if (!post || !objectUrl) {
      showToast(
        `Cannot like this post: missing post information`,
        "error"
      );
      return;
    }

    const alreadyLiked = post.likes?.some((like) => like.actor === actorUrl);
    
    setPosts((prevPosts) =>
      prevPosts.map((p) =>
        p.id !== postId
          ? p
          : {
              ...p,
              liked: !alreadyLiked,
              likes: alreadyLiked
                ? p.likes?.filter((like) => like.actor !== actorUrl) ?? []
                : [
                    ...(p.likes ?? []),
                    {
                      actor: actorUrl,
                      object: objectUrl,
                      activityPubObject: {},
                      createdAt: new Date().toISOString(),
                    },
                  ],
            }
      )
    );

    const result = await likesHook.handleLike(actorUrl, objectUrl, alreadyLiked);
    
    if (!result.success) {
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id !== postId
            ? p
            : {
                ...p,
                liked: alreadyLiked, 
                likes: alreadyLiked
                  ? [
                      ...(p.likes ?? []),
                      {
                        actor: actorUrl,
                        object: objectUrl,
                        activityPubObject: {},
                        createdAt: new Date().toISOString(),
                      },
                    ] 
                  : p.likes?.filter((like) => like.actor !== actorUrl) ?? [], 
              }
        )
      );
    }
  };

  const openComments = (post: Post) => {
    navigate(`/post/${post.id}`);
  };

  const handlePostComment = () => {
    if (!commentText.trim() || !selectedPost) return;

    const newComment = {
      id: uuidv4(),
      user: currentUser?.username || "anonymous",
      text: commentText.trim(),
    };

    const updatedPosts = posts.map((post) => {
      if (post.id === selectedPost.id) {
        return {
          ...post,
          comments: [...(post.comments || []), newComment],
        };
      }
      return post;
    });

    setPosts(updatedPosts);
    setSelectedPost({
      ...selectedPost,
      comments: [...(selectedPost.comments || []), newComment],
    });
    setCommentText("");
    setShowComments(false);
  };


  return (
    <div className="feed-container">
      {loading && <div className="feed-empty">Loading posts...</div>}
      {posts.length === 0 && !error && !loading && <div className="feed-empty">No posts yet.</div>}
      {posts.length === 0 && error && <div className="feed-failed">Failed to fetch posts.</div>}
      {posts.map((post) => (
        <div className="post-card" key={post.id}>
          <div className="post-header">
            <Link to={`/profile/${post.user?.username}`}>
              <img
                src={post.user?.profilePic || genericProfilePic}
                alt="avatar"
                className="post-avatar"
              />
            </Link>
            <div className="post-meta">
              <div className="post-user-row">
                <Link to={`/profile/${post.user?.username}`} className="post-username">
                  {post.user?.username}
                </Link>
                <PostOriginBadge postUrl={post.activityPubObject?.id || ""} />
                {post.user?.username !== currentUser?.username && (
                  <span
                    className="follow-text"
                    onClick={() => handleFollow(post.user?.username)}
                  >
                    • {isFollowing(post.user?.username || "") ? "Following" : "Follow"}
                  </span>
                )}

              </div>
              <span className="post-time">
                • {formatRelativeTime(post.createdAt)}
              </span>
            </div>
          </div>

          {post.text && (
            <div
              className="feed-post-text"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(post.text),
              }}
            />
          )}

          {post.media && post.media?.length > 0 && (
            <div className="feed-post-media">

              {post.media.map((media, index) =>
                media.type === "video" ? (
                  <video key={index} className="feed-post-video" controls>
                    <source src={media.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img key={index} className="feed-post-image" src={media.url} alt={`media-${index}`} />
                )
              )}

            </div>
          )}

          <div className="post-actions">
            <button onClick={() => handleLike(post.id)} className="icon-button">
              {post.liked ? "❤️" : "🤍"} {post.likesCount || 0}
            </button>
            <button onClick={() => openComments(post)} className="icon-button">
              💬 {post.comments?.length || 0}
            </button>
          </div>


        </div>
      ))}

      {showComments && selectedPost && (
        <div className="modal-backdrop" onClick={() => setShowComments(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <h4>{selectedPost.comments?.length || 0} Comments</h4>
              <button
                onClick={() => setShowComments(false)}
                className="close-modal"
                aria-label="Close comments"
              >
                ×
              </button>
            </div>


            <div className="comment-list">
              {selectedPost.comments?.length ? (selectedPost.comments?.map((comment) => (
                <div key={comment.id} className="comment">
                  <p>
                    <strong>{comment.user}</strong>: {comment.text}
                  </p>
                </div>
              ))) : (
                <p>No comments yet.</p>
              )}
            </div>

            <div className="comment-input-section">
              <input
                type="text"
                placeholder="Write a comment..."
                className="comment-input"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button
                className="comment-button"
                onClick={handlePostComment}
                disabled={!commentText.trim()}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
