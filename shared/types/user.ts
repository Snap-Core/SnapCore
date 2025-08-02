export interface User {
  username: string;
  displayName: string;
  summary?: string;
  publicKey: string;
  profilePicUrl: string;
  domain?: string;
}