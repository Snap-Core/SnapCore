import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Feed.css";
import type { Post } from "../../types/Post";
import { formatRelativeTime } from "../../utils/timeUtils";
import genericProfilePic from "../../assets/generic-profile-p.jpg";
import { mockPosts } from "../../services/mockPosts";

// const DEFAULT_IMAGE_URL = vpnExplained;
type FeedProps = {
  username?: string;
};

export const Feed = ({ username }: FeedProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

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


  if (loading) return <div>Loading posts...</div>;

  return (
    <div className="feed-container">
      {posts.length === 0 && <div className="feed-empty">No posts yet.</div>}
      {posts.map((post) => (
        <div className="post-card" key={post.id}>
          <div className="post-header">
            <Link to={`/profile/${post.user?.username}`} className="post-username">
            <img
              src={post.user?.profilePic || genericProfilePic}
              alt="avatar"
              className="post-avatar"
            />
            </Link>
            <div className="post-meta">
              <Link to={`/profile/${post.user?.username}`} className="post-username">
                {post.user?.name}
              </Link>
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
                  // src={DEFAULT_IMAGE_URL}
                  alt={img}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
