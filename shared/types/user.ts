export interface User {
  id: string;
  username: string;
  displayName: string;
  summary?: string;
  publicKey: string;
  profilePicUrl: string;
}