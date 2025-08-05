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
