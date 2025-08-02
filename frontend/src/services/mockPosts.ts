import type { Post } from "../types/Post";
import type { User } from "../types/User";

import user1Pic from "../assets/post4.jpg";
import user2Pic from "../assets/profile-pic.jpg";
import user3Pic from "../assets/profile.jpg";
import post1Img from "../assets/post1.jpg";
import post2Img from "../assets/post2.jpg";
import post3Img from "../assets/post3.jpg";

export const mockUsers: User[] = [
  {
    id: "u1",
    username: "john_doe",
    name: "John Doe",
    profilePic: user1Pic,
    bio: "Fullstack Dev & Coffee Addict",
    followers: 134,
    following: 88,
  },
  {
    id: "u2",
    username: "jane_smith",
    name: "Jane Smith",
    profilePic: user2Pic,
    bio: "UX Designer & Photographer",
    followers: 540,
    following: 120,
  },
  {
    id: "u3",
    username: "sam_lee",
    name: "Sam Lee",
    profilePic: user3Pic,
    bio: "Lover of nature & code",
    followers: 220,
    following: 199,
  },
];

export const mockComments = [
  {
    id: "c1",
    user: "alice",
    text: "Great post! Really enjoyed reading this.",
  },
  {
    id: "c2",
    user: "bob",
    text: "Interesting perspective, thanks for sharing.",
  },
  {
    id: "c3",
    user: "charlie",
    text: "Could you elaborate more on your last point?",
  },
  {
    id: "c4",
    user: "diana",
    text: "🔥🔥🔥",
  },
  {
    id: "c5",
    user: "eric",
    text: "I completely agree with this.",
  },
  {
    id: "c6",
    user: "frank",
    text: "This is a test comment to check if wrapping works properly. It should break into a new line if it's too long.",
  },
  {
    id: "c7",
    user: "grace",
    text: "This made my day 😄",
  },
];


export const mockPosts: Post[] = [
  {
    id: "p1",
    text: "Loving the new React 19 features!",
    images: [post1Img],
    createdAt: new Date(Date.now() - 1000 * 10).toISOString(), // 10s ago
    user: mockUsers[0],
    comments: mockComments,
  },
  {
    id: "p2",
    text: "Designing this landing page was so satisfying 🎨 #UIUX",
    images: [post2Img, post3Img],
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15m ago
    user: mockUsers[1],
  },
  {
    id: "p3",
    text: "Spotted a rare bird on my hike #NatureLover",
    images: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5h ago
    user: mockUsers[2],
  },
  {
    id: "p4",
    text: "Day 42 of #100DaysOfCode — built a weather app today!",
    images: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2d ago
    user: mockUsers[0],
  },
  {
    id: "p5",
    text: "Flashback to last summer ",
    images: [post2Img],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 2).toISOString(), // 2y ago
    user: mockUsers[1],
  },
];
