export type User = {
  id: string;
  username?: string;
  displayName?: string;
  summary?: string;
  email?: string;
  profilePic?: string;
  profilePicUrl?: string;
  followers?: number;
  following?: number;
  activated?: boolean;
  followingCount?: number;
  followersCount?: number;
};

export interface FederatedUser {
  username: string;
  domain: string;
  displayName?: string;
  summary?: string;
  profilePic?: string;
  profilePicUrl?: string;
  actorUrl?: string;
  isFederated: boolean;
  followersCount?: number;
  followingCount?: number;
}