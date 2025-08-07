import { useEffect, useRef, useState, type ChangeEvent } from "react";
import './UserProfile.css';
import { UserInfoInput } from "../../components/UserInfoInput";
import genericProfilePic from '../../assets/generic-profile-p.jpg';
import { useAuth } from "../../auth/useAuth";
import { useParams, useNavigate } from "react-router-dom";
import type { User } from "../../types/User";
import { Feed } from "../Feed/Feed";
import { useFollow } from "../../components/FollowContext";
import { getFollowersList, getFollowingList } from "../../services/followService";
import { useToast } from "../../components/ToastContext";
import { fetcher } from "../../utils/fetcher";

export const UserProfile = () => {
    const { username: routeUsername } = useParams<{ username: string }>();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [newProfilePic, setNewProfilePic] = useState<string | null>(null);
    const [showUserSetup, setShowUserSetup] = useState(false);
    const { followedUsers, followers, toggleFollow } = useFollow();
    const isFollowing = !!userProfile?.username && followedUsers.has(userProfile.username);
    const followerCount = followers.size;
    const followingCount = followedUsers.size;
    const [profileFollowersCount, setProfileFollowersCount] = useState(0);
    const [profileFollowingCount, setProfileFollowingCount] = useState(0);
    const pluralize = (count: number, noun: string) => `${count} ${noun}${count !== 1 ? "s" : ""}`;
    const { showToast } = useToast();
     const hasShownToast = useRef(false);

    const isOwnProfile = routeUsername === currentUser?.username;

    useEffect(() => {
        if (currentUser && (!currentUser.username || !currentUser.activated)) {
            setShowUserSetup(true);
            setUserProfile(currentUser);
            setLoading(false);
            return;
        }

        if (!routeUsername && currentUser?.username) {
            navigate(`/profile/${currentUser.username}`, { replace: true });
            return;
        }

        setLoading(false);
    }, [routeUsername, currentUser, navigate]);

    useEffect(() => {
        if (!routeUsername || !currentUser?.activated) return;

        const fetchProfile = async () => {
            setLoading(true);
            try {
                const data = await fetcher(`/users/${encodeURIComponent(routeUsername)}`);
                setUserProfile(data);
            } catch (error) {
                console.error("Failed to fetch user profile:", error);
                 if (!hasShownToast.current) {
                    showToast(`Failed to fetch user profile: ${routeUsername}`, "error");
                    hasShownToast.current = true;
                }
                setUserProfile(null);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [routeUsername, currentUser?.activated]);

    const fetchProfileFollowCounts = async () => {
        if (!userProfile || isOwnProfile) return;

        try {
            const profileUser = `https://yourdomain.com/users/${userProfile.username}`;
            const followingList = await getFollowingList(profileUser);
            const followerList = await getFollowersList(profileUser);

            setProfileFollowingCount(followingList.length);
            setProfileFollowersCount(followerList.length);
        } catch (error) {
            console.error("Failed to load profile follow data:", error);
            showToast(`Failed to load profile follow data`, "error");
        }
    };

    useEffect(() => {
        fetchProfileFollowCounts();
    }, [userProfile, isOwnProfile]);

    const handleFollowToggle = async () => {
        if (!userProfile?.username) return;
        await toggleFollow(userProfile.username);
        await fetchProfileFollowCounts();
    };

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

    const handleProfileComplete = async (fields: { username: string; displayName: string; summary: string }) => {
        
        try {
            setUserProfile(prev => prev ? { ...prev, ...fields, activated: true } : null);
            setShowUserSetup(false);
            
            navigate(`/profile/${fields.username}`, { replace: true });
            
            showToast("Profile completed successfully!", "success");
        } catch (error) {
            console.error("Error handling profile completion:", error);
            showToast("Error completing profile", "error");
        }
    };

    const handleProfileSetupClose = () => {
        navigate('/', { replace: true });
    };

    if (showUserSetup && userProfile) {
        return (
            <div className="user-profile-container">
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    padding: '2rem'
                }}>
                    <UserInfoInput
                        userId={userProfile.id}
                        onClose={handleProfileSetupClose}
                        onSubmit={handleProfileComplete}
                    />
                </div>
            </div>
        );
    }

    if (!routeUsername && !showUserSetup) {
        return <div className="user-profile-container">Loading...</div>;
    }

    if (loading) {
        return <div className="user-profile-container">Loading user profile...</div>;
    }

    if (!userProfile) {
        return <div className="user-profile-container">User not found</div>;
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
                    <h2>{userProfile.displayName}</h2>
                    <p className="username">@{userProfile.username}</p>
                    <p className="bio">{userProfile.summary}</p>

                    <div className="follow-info">
                        <div className="follow-info">
                            {isOwnProfile ? (
                                <>
                                    <p>{pluralize(followerCount, "follower")}</p>
                                    <p>{pluralize(followingCount, "following")}</p>
                                </>
                            ) : (
                                <>
                                    <p>{pluralize(profileFollowersCount, "follower")}</p>
                                    <p>{pluralize(profileFollowingCount, "following")}</p>
                                </>
                            )}
                        </div>
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

