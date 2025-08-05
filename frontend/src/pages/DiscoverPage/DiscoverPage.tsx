import { useState, useEffect } from "react";
import { fetcher } from "../../utils/fetcher";
import "./DiscoverPage.css";
import type { User } from "../../types/User";
import type { Post } from "../../types/Post";

export const DiscoverPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"users" | "posts">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const loadInitialUsers = async () => {
      setInitialLoading(true);
      try {
        const data = await fetcher("/users");
        setUsers(data.users.slice(0, 50)); 
      } catch (error) {
        console.error("Failed to load initial users:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadInitialUsers();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      try {
        const data = await fetcher("/users");
        setUsers(data.users.slice(0, 50));
        setPosts([]);
        setHasSearched(false);
      } catch (error) {
        console.error("Failed to reload users:", error);
      }
      return;
    }

    setLoading(true);
    try {
      if (searchType === "users") {
        const data = await fetcher(`/users/search?q=${encodeURIComponent(searchTerm)}&limit=20`);
        setUsers(data.users);
        setPosts([]);
      } else {
        const data = await fetcher(`/posts/search?q=${encodeURIComponent(searchTerm)}&limit=20`);
        setPosts(data.posts);
        setUsers([]);
      }
      setHasSearched(true);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTypeChange = (type: "users" | "posts") => {
    setSearchType(type);
    if (type === "users" && !hasSearched) {
      setPosts([]);
    } else if (type === "posts" && !hasSearched) {
      setUsers([]);
    }
  };

  const clearSearch = async () => {
    setSearchTerm("");
    setHasSearched(false);
    setLoading(true);
    
    try {
      if (searchType === "users") {
        const data = await fetcher("/users");
        setUsers(data.users.slice(0, 50));
        setPosts([]);
      } else {
        setUsers([]);
        setPosts([]);
      }
    } catch (error) {
      console.error("Failed to reload data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="discover-page">
        <div className="discover-container">
          <div className="loading">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="discover-page">
      <div className="discover-container">
        <h1>Discover</h1>
        <p>Search for users and posts across SnapCore</p>

        <div className="search-section">
          <div className="search-controls">
            <div className="search-type-selector">
              <button
                className={searchType === "users" ? "active" : ""}
                onClick={() => handleSearchTypeChange("users")}
              >
                Users
              </button>
              <button
                className={searchType === "posts" ? "active" : ""}
                onClick={() => handleSearchTypeChange("posts")}
              >
                Posts
              </button>
            </div>

            <div className="search-input-container">
              <input
                type="text"
                placeholder={`Search ${searchType}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="search-input"
              />
              <button onClick={handleSearch} className="search-button" disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </button>
              {(hasSearched || searchTerm) && (
                <button onClick={clearSearch} className="clear-button" disabled={loading}>
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="search-results">
          {loading && <div className="loading">Searching...</div>}

          {!loading && (
            <>
              {searchType === "users" && (
                <div className="users-results">
                  <h3>
                    {hasSearched 
                      ? `Search Results (${users.length})` 
                      : `All Users (${users.length})`
                    }
                  </h3>
                  {users.length === 0 ? (
                    <p>
                      {hasSearched 
                        ? `No users found matching "${searchTerm}"` 
                        : "No users available"
                      }
                    </p>
                  ) : (
                    <div className="users-grid">
                      {users.map((user, index) => (
                        <div key={user.username || index} className="user-card">
                          <img
                            src={user.profilePic || "/src/assets/generic-profile-p.jpg"}
                            alt={user.displayName}
                            className="user-avatar"
                          />
                          <div className="user-info">
                            <h4>{user.displayName || user.name}</h4>
                            <p className="username">@{user.username}</p>
                            <p className="bio">{user.summary}</p>
                            <div className="user-stats">
                              <span>{user.followers || 0} followers</span>
                              <span>{user.following || 0} following</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {searchType === "posts" && (
                <div className="posts-results">
                  <h3>Posts ({posts.length})</h3>
                  {posts.length === 0 ? (
                    <p>
                      {hasSearched 
                        ? `No posts found matching "${searchTerm}"` 
                        : "Search for posts to see results"
                      }
                    </p>
                  ) : (
                    <div className="posts-list">
                      {posts.map((post) => (
                        <div key={post.id} className="post-card">
                          <div className="post-header">
                            <img
                              src={post.user?.profilePic || "/src/assets/generic-profile-p.jpg"}
                              alt={post.user?.name}
                              className="post-avatar"
                            />
                            <div>
                              <h4>{post.user?.name}</h4>
                              <p className="post-username">@{post.user?.username}</p>
                            </div>
                          </div>
                          <div className="post-content">
                            <p>{post.text}</p>
                            {post.media && post.media.length > 0 && (
                              <div className="post-media">
                                {post.media.map((media, index) => (
                                  <img
                                    key={index}
                                    src={media.url}
                                    alt={`Post media ${index}`}
                                    className="post-image"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};