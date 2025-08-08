import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getFollowersList,
  getFollowingList,
  followUser,
  unfollowUser,
} from "../services/followService";
import { useToast } from "./ToastContext";
import { useAuth } from "../auth/useAuth";
import { buildUserUrl } from "../config/urls";



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
  const actorUrl = currentUser?.username ? buildUserUrl(currentUser.username) : '';
  const { showToast } = useToast();


  const refreshFollowData = async () => {
    if (!actorUrl) return; // Don't try to fetch if we don't have a user

    try {
      const [followingList, followerList] = await Promise.all([
        getFollowingList(actorUrl),
        getFollowersList(actorUrl)
      ]);

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
      console.error('Error fetching follow data:', error);
      showToast(`Error fetching follow data`, "error");
    }
  };

  // Refresh follow data when the component mounts and when the user changes
  useEffect(() => {
    refreshFollowData();
  }, [actorUrl, currentUser?.username]);
  
  // Set up an interval to periodically refresh follow data
  useEffect(() => {
    const intervalId = setInterval(refreshFollowData, 30000); // Refresh every 30 seconds
    return () => clearInterval(intervalId);
  }, [actorUrl]);

    const toggleFollow = async (targetUsername: string) => {
    if (!targetUsername || targetUsername === currentUser?.username) return;

    const targetUrl = buildUserUrl(targetUsername);
    const isFollowing = followedUsers.has(targetUsername);

    try {
      if (isFollowing) {
        const response = await unfollowUser(targetUrl);
        if (response.ok) {
          setFollowedUsers((prev) => {
            const updated = new Set(prev);
            updated.delete(targetUsername);
            return updated;
          });
        } else {
          throw new Error('Failed to unfollow user');
        }
      } else {
        const response = await followUser(targetUrl);
        if (response.ok) {
          setFollowedUsers((prev) => new Set(prev).add(targetUsername));
        } else {
          throw new Error('Failed to follow user');
        }
      }

      // Update local state immediately to reflect the change
      const newIsFollowing = !isFollowing;
      
      // Notify other components about the follow state change
      window.dispatchEvent(new CustomEvent('followStateChanged', { 
        detail: { 
          username: targetUsername,
          isFollowing: newIsFollowing
        }
      }));

      // Refresh follow data to ensure UI is in sync with server state
      await refreshFollowData();
    } catch (error: any) {
      console.error('Follow toggle error:', error);
      // Revert the local state change if the server request failed
      if (error.message?.includes("Already following")) {
        setFollowedUsers((prev) => new Set(prev).add(targetUsername));
      } else {
        // Revert the UI state to what it was before
        if (isFollowing) {
          setFollowedUsers((prev) => new Set(prev).add(targetUsername));
        } else {
          setFollowedUsers((prev) => {
            const updated = new Set(prev);
            updated.delete(targetUsername);
            return updated;
          });
        }
        showToast(`Failed to ${isFollowing ? 'unfollow' : 'follow'} user`, "error");
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
