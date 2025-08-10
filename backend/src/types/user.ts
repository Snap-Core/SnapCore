export interface BaseUser {
  username: string;
  displayName: string;
  fediverseId: string;
  publicKey: string;
  privateKey?: string;
  profilePicUrl?: string;
  actorUrl: string;
}

export interface LocalUser extends BaseUser {
  googleId: string;
  userName: string;
  email: string;
  isFederated: false;
  inbox: string;
  outbox: string;
}

export interface FederatedUser extends BaseUser {
  isFederated: true;
  inbox: string;
  outbox: string;
  followers: string;
  following?: string;
  summary?: string;
  domain: string;
  encryptedPrivateKey?: string;
  followersCount?: number;
}

export type User = LocalUser | FederatedUser;