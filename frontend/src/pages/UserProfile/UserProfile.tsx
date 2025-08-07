import { useEffect, useRef, useState } from "react";
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
import { URLS } from "../../enums/urls";
import { useProfilePicHandler } from "../../hooks/useProfilePicHandler";

export const UserProfile = () => {
    const { username: routeUsername } = useParams<{ username: string }>();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [newProfilePic, setNewProfilePic] = useState<string | null>(null);
    const [showUserSetup, setShowUserSetup] = useState(false);
    const [isExternalUser, setIsExternalUser] = useState(false);
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

    const parseFederatedUsername = (username: string) => {
        if (!username.includes('@')) return null;
        
        const lastAtIndex = username.lastIndexOf('@');
        const user = username.substring(0, lastAtIndex).replace(/^@+/, '');
        const domain = username.substring(lastAtIndex + 1);
        
        return user && domain ? { username: user, domain } : null;
    };

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
                const federatedInfo = parseFederatedUsername(routeUsername);
                
                if (federatedInfo) {
                    setIsExternalUser(true);
                    
                    const data = await fetcher(`/users/external?username=${encodeURIComponent(federatedInfo.username)}&domain=${encodeURIComponent(federatedInfo.domain)}`);                    
                    setUserProfile({
                        ...data,
                        username: `${federatedInfo.username}@${federatedInfo.domain}`,
                        isFederated: true,
                        domain: federatedInfo.domain
                    });
                } else {
                    setIsExternalUser(false);
                    
                    const data = await fetcher(`/users/${encodeURIComponent(routeUsername)}`);
                    setUserProfile(data);
                }
            } catch (error) {
                console.error("Failed to fetch user profile:", error);
                if (!hasShownToast.current) {
                    showToast(`Failed to fetch user profile: ${routeUsername}`, "error");
                    hasShownToast.current = true;
                }
                setUserProfile(null);
                showToast("Failed to load user profile", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [routeUsername, currentUser?.activated, showToast]);

    const fetchProfileFollowCounts = async () => {
        if (!userProfile || isOwnProfile || isExternalUser) return;

        try {
            const profileUser = `${URLS.APP}/api/users/${userProfile.username}`;
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
    }, [userProfile, isOwnProfile, isExternalUser]);

    const handleFollowToggle = async () => {
        if (!userProfile?.username || isExternalUser) return;
        await toggleFollow(userProfile.username);
        await fetchProfileFollowCounts();
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

    const { handleProfilePicChange } = useProfilePicHandler(
        (_file, profilePicUrl) => {
            setNewProfilePic(profilePicUrl);
            setUserProfile((prev) => prev ? { ...prev, profilePic: profilePicUrl } : null);

            if (!hasShownToast.current) {
                showToast(`Successfully updated profile picture`, "success");
                hasShownToast.current = true;
            }
        },
        (err) => {
            if (!hasShownToast.current) {
                showToast(`Failed to update profile picture: ${err}`, "error");
                hasShownToast.current = true;
            }
        }
    );

    const handleProfileSetupClose = () => {
        navigate('/', { replace: true });
    };

    const handleBackClick = () => {
        navigate(-1); 
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
        return (
            <div className="user-profile-container">
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <h2>User Not Found</h2>
                    <p>The user profile could not be loaded.</p>
                    <button 
                        onClick={handleBackClick}
                        style={{
                            padding: '0.5rem 1rem',
                            background: '#4f46e5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            marginTop: '1rem'
                        }}
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (isOwnProfile && !userProfile.activated) {
        return (
            <UserInfoInput
                userId={userProfile.id}
                onClose={() => { }}
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
                        src={`http://localhost:3000${newProfilePic || userProfile.profilePic || genericProfilePic}`}
                        alt="Profile"
                        className="profile-pic"
                    />
                    {isOwnProfile && !isExternalUser && (
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
                    <p className="bio" dangerouslySetInnerHTML={{ __html: userProfile.summary || '' }}></p>

                    {isExternalUser && (
                        <div className="discover-federated-badge" style={{ marginTop: '1rem' }}>
                            <span>🌐 Federated User</span>
                        </div>
                    )}

                    <div className="follow-info">
                        {!isExternalUser ? (
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
                        ) : (
                            <div className="follow-info">
                                <p>{pluralize(userProfile.followersCount || 0, "follower")}</p>
                                <p>{pluralize(userProfile.followingCount || 0, "following")}</p>
                            </div>
                        )}
                    </div>
                    
                    {!isOwnProfile && !isExternalUser && (
                        <button className="follow-button" onClick={handleFollowToggle}>
                            {isFollowing ? "Following" : "Follow"}
                        </button>
                    )}

                    {isExternalUser && (
                        <button 
                            onClick={handleBackClick}
                            style={{
                                padding: '0.5rem 1rem',
                                background: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                marginTop: '1rem'
                            }}
                        >
                            ← Back to Search
                        </button>
                    )}
                </div>
            </div>
            
            <div className="user-posts">
                <h3>Posts</h3>
                {!isExternalUser ? (
                    <Feed username={userProfile.username} />
                ) : (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>
                        Posts from federated users are not displayed in this demo.
                    </p>
                )}
            </div>
        </div>
    );
};

