export interface Community {
  handle: string;
  displayName: string;
  summary?: string;
  communityPicUrl: string;
  domain?: string;
  created: Date;
  updated: Date;
}