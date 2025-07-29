import { useEffect, useState } from "react";
import { fetcher } from "../../utils/fetcher";
import "./Feed.css";
import type { Post } from "../../types/Post";
import vpnExplained from "../../assets/db.jpg";

const DEFAULT_IMAGE_URL = vpnExplained;

export const Feed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetcher("/posts")
      .then((data) => {
        setPosts(data.reverse());
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="feed-loading">Loading...</div>;

  return (
    <div className="feed-container">
      {posts.length === 0 && <div className="feed-empty">No posts yet.</div>}
      {posts.map((post) => (
        <div className="feed-post" key={post.id}>
          <div className="feed-post-meta">
            <span>{new Date(post.createdAt).toLocaleString()}</span>
          </div>
          {post.text && <div className="feed-post-text">{post.text}</div>}
          {post.images && post.images.length > 0 && (
            <div className="feed-post-images">
              {post.images.map((img, i) => (
                <img
                  key={i}
                  className="feed-post-image"
                  src={DEFAULT_IMAGE_URL}
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