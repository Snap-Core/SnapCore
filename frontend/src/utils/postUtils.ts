
import { isLocalPost as isLocalPostFromConfig } from "../config/urls";

export const isLocalPost = isLocalPostFromConfig;

export const getPostOrigin = (postUrl: string): string => {
  if (isLocalPost(postUrl)) {
    return 'Local';
  }
  
  try {
    const url = new URL(postUrl);
    return url.hostname;
  } catch {
    return 'Unknown';
  }
};

export const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
};
