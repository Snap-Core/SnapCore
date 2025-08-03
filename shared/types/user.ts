export interface User {
  id: string;
  username: string;
  displayName: string;
  summary?: string;
  profilePicUrl: string;
  domain?: string;
  publicKey: string;
  encryptedPrivateKey?: string;
}