export type FollowActivity = {
  _id: string;
  actor: string;
  object: string;
};

const BASE_URL = "https://snapcore.subspace.site";

export const followUser = async (actor: string, object: string) => {
  const activity = {
    type: "Follow",
    actor,
    object,
  };

  const res = await fetch(`${BASE_URL}/api/follow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(activity),
  });

  if (!res.ok) {
    throw new Error("Failed to follow user");
  } else {
    console.log("Profile followed successfully!");
  }

  return res.json();
};

export const unfollowUser = async (actor: string, object: string) => {
  const res = await fetch(`${BASE_URL}/api/follow`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      actor: actor,
      object: object,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to unfollow user");
  } else {
    console.log("Profile unfollowed successfully!");
  }

  return res.json();
};

export const getFollows = async () => {
  const res = await fetch(`${BASE_URL}/api/follow`);
  if (!res.ok) throw new Error("Failed to fetch follows");
  const follows = await res.json();
  console.log(follows);
};

export const getFollowersActors = async (
  username: string
): Promise<string[]> => {
  const encodedActor = encodeURIComponent(username);
  const response = await fetch(`${BASE_URL}/api/follow/${encodedActor}/actors`);
  if (!response.ok) throw new Error("Failed to fetch followers list");
  return await response.json();
};

export const getFollowersCount = async (
  username: string
): Promise<string[]> => {
  const encodedActor = encodeURIComponent(username);
  const response = await fetch(`${BASE_URL}/api/follow/${encodedActor}/count`);
  if (!response.ok) throw new Error("Failed to fetch followers list");
  return await response.json();
};

export const getFollowersList = async (
  username: string
): Promise<FollowActivity[]> => {
  const encodedActor = encodeURIComponent(username);
  const response = await fetch(`${BASE_URL}/api/follow/${encodedActor}/followers`);
  if (!response.ok) throw new Error("Failed to fetch followers list");
  return await response.json();
};

export const getFollowingList = async (
  username: string
): Promise<FollowActivity[]> => {
  const encodedActor = encodeURIComponent(username);
  const response = await fetch(`${BASE_URL}/api/follow/${encodedActor}/following`);
  if (!response.ok) throw new Error("Failed to fetch following list");
  return await response.json();
};

export const getFollowingCount = async (
  username: string
): Promise<string[]> => {
  const encodedActor = encodeURIComponent(username);
  const response = await fetch(
    `${BASE_URL}/api/follow/${encodedActor}/following/count`
  );
  if (!response.ok) throw new Error("Failed to fetch following list");
  return await response.json();
};
