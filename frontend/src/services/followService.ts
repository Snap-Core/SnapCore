import { fetcher } from "../utils/fetcher";

export type FollowActivity = {
  _id: string;
  actor: string;
  object: string;
};

export const followUser = async (actor: string, object: string) => {
  const activity = {
    "@context": "https://www.w3.org/ns/activitystreams",
    type: "Follow",
    actor,
    object,
  };

  // Check if the object URL is external (contains a different domain)
  const isExternal = new URL(object).hostname !== new URL(actor).hostname;
  
  const endpoint = isExternal ? "/follow/external" : "/follow";
  
  const response = await fetcher(endpoint, {
    method: "POST",
    body: activity,
  });

  return response;
};

export const unfollowUser = async (actor: string, object: string) => {
  const response = await fetcher("/follow", {
    method: "DELETE",
    body: {
      actor: actor,
      object: object,
    },
  });

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
