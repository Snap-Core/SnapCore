import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Feed.css";
import type { Post } from "../../types/Post";
import { fetcher } from "../../utils/fetcher";
import { formatRelativeTime } from "../../utils/timeUtils";
import genericProfilePic from "../../assets/generic-profile-p.jpg";
import { mockPosts } from "../../services/mockPosts";
import { useAuth } from "../../auth/useAuth";
import { v4 as uuidv4 } from "uuid";

type FeedProps = {
  username?: string;
};

export const Feed = ({ username }: FeedProps) => {
  const { user: currentUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");


  // useEffect(() => {
  //   let url = "/posts";
  //   if (username) url += `?username=${username}`;

  //   fetcher(url)
  //     .then((data: Post[]) => {
  //       setPosts(data);
  //       setLoading(false);
  //     })
  //     .catch((err) => {
  //       console.error("Failed to fetch posts", err);
  //       setLoading(false);
  //     });
  // }, [username]);

  // mock feed data
  useEffect(() => {
    const filteredPosts = username
      ? mockPosts.filter((post) => post.user?.username === username)
      : mockPosts;
    setPosts(filteredPosts);
    setLoading(false);
  }, [username]);

  useEffect(() => {
    if (showComments) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
    return () => document.body.classList.remove("no-scroll");
  }, [showComments]);


  const handleFollow = (username?: string) => {
    if (!username) return;

    setFollowedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(username)) {
        newSet.delete(username);
      } else {
        newSet.add(username);
      }
      return newSet;
    });
  };

  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
            ...post,
            likes: post.liked ? (post.likes ?? 0) - 1 : (post.likes ?? 0) + 1,
            liked: !post.liked,
          }
          : post
      )
    );
  };


  const openComments = (post: Post) => {
    setSelectedPost(post);
    setShowComments(true);
  };

  const handlePostComment = () => {
    if (!commentText.trim() || !selectedPost) return;

    const newComment = {
      id: uuidv4,
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



  if (loading) return <div>Loading posts...</div>;

  return (
    <div className="feed-container">
      {posts.length === 0 && <div className="feed-empty">No posts yet.</div>}
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
                  {post.user?.name}
                </Link>
                {post.user?.username !== currentUser?.username && (
                  <span
                    className="follow-text"
                    onClick={() => handleFollow(post.user?.username)}
                  >
                    • {followedUsers.has(post.user?.username || "") ? "Following" : "Follow"}
                  </span>
                )}

              </div>
              <span className="post-time">
                • {formatRelativeTime(post.createdAt)}
              </span>
            </div>
          </div>

          {post.text && <div className="feed-post-text">{post.text}</div>}

          {post.images && post.images.length > 0 && (
            <div className="feed-post-images">
              {post.images.map((img, i) => (
                <img
                  key={i}
                  className="feed-post-image"
                  src={img}
                  alt={img}
                />
              ))}
            </div>
          )}
          <div className="post-actions">
            <button onClick={() => handleLike(post.id)} className="icon-button">
              {post.liked ? "❤️" : "🤍"} {post.likes || 0}
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
              <h4>Comments</h4>
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
