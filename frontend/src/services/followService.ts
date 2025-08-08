import { fetcher } from "../utils/fetcher";

export type FollowActivity = {
  _id: string;
  actor: string;
  object: string;
};

export const followUser = async (object: string, isFederated: boolean = false) => {
  const activity = {
    type: "Follow",
    object,
    isFederated
  };

  const response = await fetcher("/follow", {
    method: "POST",
    body: activity,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to follow user');
  }

  return response;
};

export const unfollowUser = async (object: string) => {
  const response = await fetcher("/follow", {
    method: "DELETE",
    body: JSON.stringify({
      actor: window.location.origin + '/users/' + localStorage.getItem('username'),
      object
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to unfollow user');
  }

  return response;
};

export const getFollows = async () => {
  return fetcher("/follow");
};

export const getFollowersActors = async (
  username: string
): Promise<string[]> => {
  const encodedActor = encodeURIComponent(username);
  return fetcher(`/follow/${encodedActor}/actors`);
};

export const getFollowersCount = async (
  username: string
): Promise<string[]> => {
  const encodedActor = encodeURIComponent(username);
  return fetcher(`/follow/${encodedActor}/count`);
};

export const getFollowersList = async (
  username: string
): Promise<FollowActivity[]> => {
  const encodedActor = encodeURIComponent(username);
  return fetcher(`/follow/${encodedActor}/followers`);
};

export const getFollowingList = async (
  username: string
): Promise<FollowActivity[]> => {
  const encodedActor = encodeURIComponent(username);
  return fetcher(`/follow/${encodedActor}/following`);
};

export const getFollowingCount = async (
  username: string
): Promise<string[]> => {
  const encodedActor = encodeURIComponent(username);
  return fetcher(`/follow/${encodedActor}/following/count`);
};
