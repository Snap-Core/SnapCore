export interface Community {
  id: string;
  handle: string;
  displayName: string;
  summary?: string;
  communityPicUrl: string;
  domain?: string;
  created: Date;
  updated: Date
  publicKey: string;
  encryptedPrivateKey: string;
}