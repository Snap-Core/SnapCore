import React from 'react';
import './UserProfile.css';
import profilePic from '../../assets/profile-pic.jpg';
import genericProfilePic from '../../assets/generic-profile-p.jpg';
import post1 from '../../assets/post1.jpg';
import post2 from '../../assets/post2.jpg';
import post3 from '../../assets/post1.jpg';
import post4 from '../../assets/post2.jpg';

const mockUser = {
    username: 'john_doe',
    name: 'John Doe',
    bio: 'Photographer & World Traveler',
    profilePic: profilePic,
    followers: 120,
    following: 80,
};

const mockPosts = [
    {
        id: 1,
        image: post1,
        caption: "Exploring the mountains",
    },
    {
        id: 2,
        image: post1,
        caption: "Sunset by the lake",
    },
    {
        id: 3,
        image: post2,
        caption: "City vibes",
    },
    {
        id: 4,
        image: post3,
        caption: "Exploring the mountains",
    },
    {
        id: 5,
        image: post4,
        caption: "Sunset by the lake",
    },
    {
        id: 6,
        image: "https://source.unsplash.com/random/300x300?sig=3",
        caption: "City vibes",
    },
];

export const UserProfile = () => {
    return (
        <div className="user-profile-container">
            <div className="user-header">
                <img src={mockUser.profilePic} alt={genericProfilePic} className="profile-pic" />
                <div className="user-info">
                    <h2>{mockUser.name}</h2>
                    <p className="username">@{mockUser.username}</p>
                    <p className="bio">{mockUser.bio}</p>
                    <div className="follow-info">
                        <span><strong>{mockUser.followers}</strong> Followers</span>
                        <span><strong>{mockUser.following}</strong> Following</span>
                    </div>
                    <button className="follow-button">Follow</button>
                </div>
            </div>

            <div className="user-posts">
                <h3>Posts</h3>
                <div className="post-gallery">
                    {mockPosts.map((post) => (
                        <div key={post.id} className="post-item">
                            <img src={post.image} alt="Post" />
                            <p>{post.caption}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

