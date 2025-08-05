export interface Community {
  fediverseId: string;
  handle: string;
  displayName: string;
  summary?: string;
  communityPicUrl?: string;
  inbox?: string;
  outbox?: string;
  followers?: string;
  following?: string;
  created: Date;
  updated: Date
  publicKey: string;
  encryptedPrivateKey: string;
}