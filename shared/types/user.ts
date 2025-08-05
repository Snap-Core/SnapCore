export interface User {
  fediverseId: string;
  username: string;
  displayName: string;
  summary?: string;
  profilePicUrl: string;
  inbox?: string;
  outbox?: string;
  followers?: string;
  following?: string;
  publicKey: string;
  encryptedPrivateKey?: string;
}