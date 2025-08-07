export type User = {
  id: string;
  username?: string;
  displayName?: string;
  summary?: string;
  email?: string;
  profilePic?: string;
  followers?: number;
  following?: number;
  activated?: boolean;
};

export interface FederatedUser {
  username: string;
  domain: string;
  displayName?: string;
  summary?: string;
  profilePic?: string;
  actorUrl?: string;
  isFederated: boolean;
}