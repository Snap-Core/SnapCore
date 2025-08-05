import { useEffect, useState, type ChangeEvent } from "react";
import './UserProfile.css';
import { UserInfoInput } from "../../components/UserInfoInput";
import { fetcher } from "../../utils/fetcher";
import genericProfilePic from '../../assets/generic-profile-p.jpg';
import { useAuth } from "../../auth/useAuth";
import { useParams, useNavigate } from "react-router-dom";
import type { User } from "../../types/User";
import { Feed } from "../Feed/Feed";

export const UserProfile = () => {
  const { username: routeUsername } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [newProfilePic, setNewProfilePic] = useState<string | null>(null);

  const isOwnProfile = routeUsername === currentUser?.username;

  useEffect(() => {
    if (!routeUsername && currentUser?.username) {
      navigate(`/profile/${currentUser.username}`, { replace: true });
      return;
    }
  }, [routeUsername, currentUser, navigate]);

  useEffect(() => {
    if (!routeUsername) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await fetcher(`/users/${encodeURIComponent(routeUsername)}`);
        setUserProfile(data.user);
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [routeUsername]);

  const handleProfilePicChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setNewProfilePic(url);
      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              profilePic: url,
            }
          : null
      );
    }
  };

  const handleFollowToggle = () => {
    setIsFollowing((prev) => !prev);
    // TODO: Add API call for follow/unfollow
  };

  if (!routeUsername) {
    return <div className="user-profile-container">Loading...</div>;
  }

  if (loading) {
    return <div className="user-profile-container">Loading user profile...</div>;
  }

  if (!userProfile) {
    return <div className="user-profile-container">User not found</div>;
  }

  if (isOwnProfile && !userProfile.activated) {
    return (
      <UserInfoInput
        userId={userProfile.id}
        onClose={() => {}}
        onSubmit={fields => {
          setUserProfile({ ...userProfile, ...fields, activated: true });
        }}
      />
    );
  }

  return (
    <div className="user-profile-container">
      <div className="user-header">
        <div className="profile-pic-wrapper">
          <img
            src={newProfilePic || userProfile.profilePic || genericProfilePic}
            alt="Profile"
            className="profile-pic"
          />
          {isOwnProfile && (
            <div className="edit-pic-overlay" title="Upload new profile picture">
              <label className="edit-pic-label">
                Change
                <input type="file" accept="image/*" onChange={handleProfilePicChange} hidden />
              </label>
            </div>
          )}
        </div>
        <div className="user-info">
          <h2>{userProfile.displayName || userProfile.name}</h2>
          <p className="username">@{userProfile.username}</p>
          <p className="bio">{userProfile.summary}</p>
          <div className="follow-info">
            <span><strong>{userProfile.followers || 0}</strong> Followers</span>
            <span><strong>{userProfile.following || 0}</strong> Following</span>
          </div>
          {!isOwnProfile && (
            <button className="follow-button" onClick={handleFollowToggle}>
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>
      </div>
      <div className="user-posts">
        <h3>Posts</h3>
        <Feed username={userProfile.username} />
      </div>
    </div>
  );
};

