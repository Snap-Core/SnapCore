import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  getFollowersList,
  getFollowingList,
  followUser,
  unfollowUser,
} from "../services/followService";
import { useToast } from "./ToastContext";
import { useAuth } from "../auth/useAuth";

type FollowActivity = {
  _id: string;
  actor: string;
  object: string;
};

type FollowContextType = {
  followedUsers: Set<string>;
  followers: Set<string>;
  toggleFollow: (username: string) => Promise<void>;
  refreshFollowData: () => Promise<void>;
  followerCount: number;
  followingCount: number;
};

const FollowContext = createContext<FollowContextType | undefined>(undefined);

// Simulated logged-in user
// const currentUser = { username: "Happy" };

export const FollowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [followers, setFollowers] = useState<Set<string>>(new Set());
  const { user: currentUser } = useAuth();
  const actorUrl = `https://yourdomain.com/users/${currentUser?.username}`;
  const { showToast } = useToast();
  const hasShownToast = useRef(false);

  const refreshFollowData = async () => {
    try {
      const followingList: FollowActivity[] = await getFollowingList(actorUrl);
      const followerList: FollowActivity[] = await getFollowersList(actorUrl);

      const followingSet = new Set(
        followingList
          .map((f) => f.object?.split("/").pop())
          .filter((username): username is string => typeof username === "string")
      );
      setFollowedUsers(followingSet);

      const followerSet = new Set(
        followerList
          .map((f) => f.actor?.split("/").pop())
          .filter((username): username is string => typeof username === "string")
      );
      setFollowers(followerSet);
    } catch (error) {
      showToast(`Error fetching follow data`, "error");
    }
  };

  useEffect(() => {
    refreshFollowData();
  }, []);

  const toggleFollow = async (targetUsername: string) => {
    if (!targetUsername || targetUsername === currentUser?.username) return;

    const targetUrl = `https://yourdomain.com/users/${targetUsername}`;
    const isFollowing = followedUsers.has(targetUsername);

    try {
      if (isFollowing) {
        await unfollowUser(actorUrl, targetUrl);
        setFollowedUsers((prev) => {
          const updated = new Set(prev);
          updated.delete(targetUsername);
          return updated;
        });
      } else {
        await followUser(actorUrl, targetUrl);
        setFollowedUsers((prev) => new Set(prev).add(targetUsername));
      }
    } catch (error) {
      if (!hasShownToast.current) {
        showToast(`Failed to toggle follow`, "error");
        hasShownToast.current = true;
      }

    }
  };

  return (
    <FollowContext.Provider
      value={{
        followedUsers,
        followers,
        toggleFollow,
        refreshFollowData,
        followerCount: followers.size,
        followingCount: followedUsers.size,

      }}
    >
      {children}
    </FollowContext.Provider>
  );
};

export const useFollow = (): FollowContextType => {
  const context = useContext(FollowContext);
  if (!context) {
    throw new Error("useFollow must be used within a FollowProvider");
  }
  return context;
};
