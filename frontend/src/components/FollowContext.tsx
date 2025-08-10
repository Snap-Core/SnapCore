import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import {
  getFollowersList,
  getFollowingList,
  followUser,
  unfollowUser,
} from "../services/followService";
import { useToast } from "./ToastContext";
import { buildUserUrl } from "../config/urls";
import { fetcher } from "../utils/fetcher";
import type { User } from "../types/User";

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
  loading: boolean;
};

const FollowContext = createContext<FollowContextType | undefined>(undefined);


export const FollowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [followers, setFollowers] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const hasShownToast = useRef(false);

  useEffect(() => {
    fetcher('/users/me')
      .then((data) => {
        setCurrentUser(data?.user || null);
      })
      .catch(() => {
        setCurrentUser(null);
        if (!hasShownToast.current) {
          showToast('Failed to fetch user data', 'error');
          hasShownToast.current = true;
        }
      })
      .finally(() => setLoading(false));
  }, [showToast]);
   

  const refreshFollowData = useCallback(async () => {
    if (!currentUser?.username) {
      return; 
    }
    
    try {
      const currentActorUrl = buildUserUrl(currentUser.username);
      const followingList: FollowActivity[] = await getFollowingList(currentActorUrl);
      const followerList: FollowActivity[] = await getFollowersList(currentActorUrl);

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
  }, [currentUser?.username, showToast]);

  useEffect(() => {
    if (currentUser?.username) {
      refreshFollowData();
    }
  }, [currentUser?.username, refreshFollowData]);

  const toggleFollow = async (targetUsername: string) => {
    if (!targetUsername || targetUsername === currentUser?.username) return;
    if (!currentUser?.username) {
      showToast("You must be logged in to follow users", "error");
      return;
    }

    const currentActorUrl = buildUserUrl(currentUser.username);
    const targetUrl = buildUserUrl(targetUsername);
    const isFollowing = followedUsers.has(targetUsername);

    try {
      if (isFollowing) {
        await unfollowUser(currentActorUrl, targetUrl);
        
        setFollowedUsers((prev) => {
          const updated = new Set(prev);
          updated.delete(targetUsername);
          return updated;
        });
      } else {
        await followUser(currentActorUrl, targetUrl);
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
        loading
      }}
    >
      {loading ? null : children}
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
