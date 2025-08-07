import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetcher } from "../../utils/fetcher";
import "./DiscoverPage.css";
import type { FederatedUser, User } from "../../types/User";
import type { Post } from "../../types/Post";

export const DiscoverPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"users" | "posts">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [federatedUsers, setFederatedUsers] = useState<FederatedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const filterActivatedUsers = (users: User[]) => {
    return users.filter(user => user.activated === true);
  };

  const formatFollowCount = (count: number | undefined) => {
    if (count === undefined || count === null) return "0";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  useEffect(() => {
    const loadInitialUsers = async () => {
      setInitialLoading(true);
      try {
        const data = await fetcher("/users");
        const activatedUsers = filterActivatedUsers(data.users || []);
        setUsers(activatedUsers.slice(0, 50)); 
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
        const activatedUsers = filterActivatedUsers(data.users || []);
        setUsers(activatedUsers.slice(0, 50));
        setPosts([]);
        setFederatedUsers([]);
        setHasSearched(false);
      } catch (error) {
        console.error("Failed to reload users:", error);
      }
      return;
    }

    setLoading(true);
    try {
      if (searchType === "users") {
        const data = await fetcher(`/users/search?q=${encodeURIComponent(searchTerm)}&limit=20&includeFederated=true`);
        const activatedUsers = filterActivatedUsers(data.users || []);
        setUsers(activatedUsers);
        setFederatedUsers(data.federatedUsers || []);
        setPosts([]);
      } else {
        const data = await fetcher(`/posts/search?q=${encodeURIComponent(searchTerm)}&limit=20`);
        setPosts(data.posts || []);
        setUsers([]);
        setFederatedUsers([]);
      }
      setHasSearched(true);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = async () => {
    setSearchTerm("");
    setHasSearched(false);
    setLoading(true);
    
    try {
      if (searchType === "users") {
        const data = await fetcher("/users");
        const activatedUsers = filterActivatedUsers(data.users || []);
        setUsers(activatedUsers.slice(0, 50));
        setPosts([]);
        setFederatedUsers([]);
      } else {
        setUsers([]);
        setPosts([]);
        setFederatedUsers([]);
      }
    } catch (error) {
      console.error("Failed to reload data:", error);
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
      setFederatedUsers([]);
    }
  };

  const handleUserClick = (username: string) => {
    navigate(`/profile/${username}`);
  };

  const handleFederatedUserClick = (user: FederatedUser) => {
    navigate(`/profile/${user.username}@${user.domain}`);
  };

  if (initialLoading) {
    return (
      <div className="discover-page">
        <div className="discover-container">
          <div className="discover-loading">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="discover-page">
      <div className="discover-container">
        <h1 className="discover-title">Discover</h1>
        <p className="discover-subtitle">Search for users and posts across SnapCore</p>

        <div className="discover-search-section">
          <div className="discover-search-controls">
            <div className="discover-type-selector">
              <button
                className={`discover-type-button ${searchType === "users" ? "active" : ""}`}
                onClick={() => handleSearchTypeChange("users")}
              >
                Users
              </button>
              <button
                className={`discover-type-button ${searchType === "posts" ? "active" : ""}`}
                onClick={() => handleSearchTypeChange("posts")}
              >
                Posts
              </button>
            </div>

            <div className="discover-input-container">
              <input
                type="text"
                placeholder={`Search ${searchType}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="discover-search-input"
              />
              <button 
                onClick={handleSearch} 
                className="discover-search-button" 
                disabled={loading}
              >
                {loading ? "Searching..." : "Search"}
              </button>
              {(hasSearched || searchTerm) && (
                <button 
                  onClick={clearSearch} 
                  className="discover-clear-button" 
                  disabled={loading}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="discover-results">
          {loading && <div className="discover-loading">Searching...</div>}

          {!loading && (
            <>
              {searchType === "users" && (
                <div className="discover-users-section">
                  <h3 className="discover-results-title">
                    {hasSearched 
                      ? `Local Users (${users.length})` 
                      : `All Local Users (${users.length})`
                    }
                  </h3>
                  {users.length === 0 ? (
                    <p className="discover-no-results">
                      {hasSearched 
                        ? "No activated users found matching your search" 
                        : "No activated users found"
                      }
                    </p>
                  ) : (
                    <div className="discover-users-grid">
                      {users.map((user, index) => (
                        <div 
                          key={user.username || index} 
                          className="discover-user-card"
                          onClick={() => handleUserClick(user.username!)}
                        >
                          <img
                            src={user.profilePic || "/src/assets/generic-profile-p.jpg"}
                            alt={user.displayName || user.username}
                            className="discover-user-avatar"
                          />
                          <div className="discover-user-details">
                            <h4 className="discover-user-name">{user.displayName || user.username}</h4>
                            <p className="discover-user-username">@{user.username}</p>
                            <p className="discover-user-bio">{user.summary}</p>
                            <div className="discover-user-stats">
                              <span className="discover-user-stat">{formatFollowCount(user.followersCount || 0)} followers</span>
                              <span className="discover-user-stat">{formatFollowCount(user.followingCount || 0)} following</span>
                            </div>
                            {user.activated && (
                              <div className="discover-user-activation-status">
                                ✅ Activated
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {hasSearched && federatedUsers.length > 0 && (
                    <>
                      <h3 className="discover-results-title discover-federated-title">
                        Federated Users ({federatedUsers.length})
                      </h3>
                      <div className="discover-users-grid">
                        {federatedUsers.map((user, index) => (
                          <div 
                            key={user.username && user.domain ? `${user.username}@${user.domain}` : index} 
                            className="discover-user-card discover-federated-card"
                            onClick={() => handleFederatedUserClick(user)}
                          >
                            <img
                              src={user.profilePicUrl || user.profilePic || "/src/assets/generic-profile-p.jpg"}
                              alt={user.displayName || user.username}
                              className="discover-user-avatar"
                            />
                            <div className="discover-user-details">
                              <h4 className="discover-user-name">{user.displayName || user.username}</h4>
                              <p className="discover-user-username">@{user.username}@{user.domain}</p>
                              <p className="discover-user-bio" dangerouslySetInnerHTML={{ __html: user.summary || '' }}></p>
                              
                              {/* Add follow counts for federated users */}
                              <div className="discover-user-stats">
                                <span className="discover-user-stat">
                                  {formatFollowCount(user.followersCount)} followers
                                </span>
                                <span className="discover-user-stat">
                                  {formatFollowCount(user.followingCount)} following
                                </span>
                              </div>
                              
                              <div className="discover-federated-badge">
                                <span>🌐 Federated User</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {searchType === "posts" && (
                <div className="discover-posts-section">
                  <h3 className="discover-results-title">Posts ({posts.length})</h3>
                  {posts.length === 0 ? (
                    <p className="discover-no-results">
                      {hasSearched 
                        ? `No posts found matching "${searchTerm}"` 
                        : "Search for posts to see results"
                      }
                    </p>
                  ) : (
                    <div className="discover-posts-list">
                      {posts.map((post) => (
                        <div key={post.id} className="discover-post-card">
                          <div className="discover-post-header">
                            <img
                              src={post.user?.profilePic || "/src/assets/generic-profile-p.jpg"}
                              alt={post.user?.displayName || post.user?.username}
                              className="discover-post-avatar"
                            />
                            <div>
                              <h4 className="discover-post-author">{post.user?.displayName || post.user?.username}</h4>
                              <p className="discover-post-username">@{post.user?.username}</p>
                            </div>
                          </div>
                          <div className="discover-post-content">
                            <p>{post.text}</p>
                            {post.media && post.media.length > 0 && (
                              <div className="discover-post-media">
                                {post.media.map((media, index) => (
                                  <img
                                    key={index}
                                    src={media.url}
                                    alt={`Post media ${index}`}
                                    className="discover-post-image"
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