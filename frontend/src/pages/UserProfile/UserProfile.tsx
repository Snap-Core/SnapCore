import { useEffect, useState, type ChangeEvent } from "react";
import './UserProfile.css';
import type { User } from "../../types/User";
import { useParams } from "react-router-dom";
import { Feed } from "../Feed/Feed";
import genericProfilePic from '../../assets/generic-profile-p.jpg';
import { fetcher } from "../../utils/fetcher";
import { mockUsers } from "../../services/mockPosts";

const currentUser = {
    username: "john_doe", // Simulate logged-in user
};

export const UserProfile = () => {
    const { username } = useParams<{ username: string }>();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [newProfilePic, setNewProfilePic] = useState<string | null>(null);

    // useEffect(() => {
    //     if (!username) return;

    //     fetcher(`/users/${username}`)
    //         .then((data: User) => {
    //             setUser(data);
    //             setLoading(false);
    //         })
    //         .catch((err) => {
    //             console.error("Failed to fetch user", err);
    //             setLoading(false);
    //         });
    // }, [username]);

    // mock user
    useEffect(() => {
        if (!username) return;
        setLoading(true);
        const foundUser = mockUsers.find((u) => u.username === username);

        if (foundUser) {
            setUser(foundUser);
        } else {
            console.warn("No user found for username:", username);
            setUser(null);
        }
        setLoading(false);
    }, [username]);

    const handleFollowToggle = () => {
        setIsFollowing((prev) => !prev);
        setUser((prev) =>
            prev
                ? {
                    ...prev,
                    followers: (prev.followers ?? 0) + (isFollowing ? -1 : 1),
                }
                : null
        );
    };

    const handleProfilePicChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setNewProfilePic(url);

            setUser((prev) =>
                prev
                    ? {
                        ...prev,
                        profilePic: url,
                    }
                    : null
            );
        }
    };

    if (loading) {
        return <div className="user-profile-container">Loading user profile...</div>;
    }

    if (!user) {
        return <div className="user-profile-container">User not found</div>;
    }

    const isOwnProfile = currentUser?.username === user.username;

    return (
        <div className="user-profile-container">
            <div className="user-header">
                <div className="profile-pic-wrapper">
                    <img
                        src={newProfilePic || user.profilePic || genericProfilePic}
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
                    <h2>{user.name}</h2>
                    <p className="username">@{user.username}</p>
                    <p className="bio">{user.bio}</p>
                    <div className="follow-info">
                        <span><strong>{user.followers}</strong> Followers</span>
                        <span><strong>{user.following}</strong> Following</span>
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
                <Feed username={user.username} />
            </div>
        </div>
    );
};

