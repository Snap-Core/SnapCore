const isProduction = true;

export const URLS = {
  BACKEND_API: isProduction ? 'https://snapcore.subspace.site/api' : 'http://localhost:3000/api',
  
  BACKEND_BASE: isProduction ? 'https://snapcore.subspace.site' : 'http://localhost:3000',
  
  BACKEND_UPLOADS: isProduction ? 'https://snapcore.subspace.site/uploads' : 'http://localhost:3000/uploads',
  
  FEDIVERSE_SERVER: isProduction ? 'https://snapcore-fediverse.subspace.site' : 'http://localhost:4000',
  
  FRONTEND_BASE: isProduction ? 'https://snapcore.subspace.site' : 'http://localhost:5173',
} as const;

export const buildUserUrl = (username: string): string => {
  return `${URLS.BACKEND_BASE}/users/${username}`;
};

export const buildProfilePicUrl = (profilePicPath: string): string => {
  if (!profilePicPath) return '';
  return profilePicPath.startsWith('http') 
    ? profilePicPath 
    : `${URLS.BACKEND_BASE}${profilePicPath}`;
};

export const isLocalPost = (postUrl: string): boolean => {
  try {
    const url = new URL(postUrl);
    return (
      url.origin === URLS.BACKEND_BASE ||
      url.origin === URLS.FRONTEND_BASE ||
      postUrl.includes('localhost:3000')
    );
  } catch (error) {
    console.error('Error parsing post URL:', error);
    return false;
  }
};
