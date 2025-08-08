export interface BaseUser {
  username: string;
  displayName: string;
  fediverseId: string;
  publicKey?: string;
  profilePicUrl?: string;
}

export interface LocalUser extends BaseUser {
  googleId: string;
  userName: string;
  email: string;
  isFederated: false;
}

export interface FederatedUser extends BaseUser {
  isFederated: true;
  inbox: string;
  outbox?: string;
  followers?: string;
  following?: string;
  summary?: string;
  domain: string;
  encryptedPrivateKey?: string;
  followersCount?: number;
}

export type User = LocalUser | FederatedUser;