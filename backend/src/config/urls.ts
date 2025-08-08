const isProduction = true

export const URLS = {
  BACKEND_BASE: isProduction ? 'https://snapcore.subspace.site' : (process.env.BACKEND_SERVER_URL || 'http://localhost:3000'),
  
  FEDIVERSE_SERVER: isProduction ? 'https://snapcore-fediverse.subspace.site' : (process.env.FEDIVERSE_SERVER_URL || 'http://localhost:4000'),
  
  FRONTEND_BASE: isProduction ? 'https://snapcore.subspace.site' : (process.env.FRONTEND_SERVER_URL || 'http://localhost:5173'),
  
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/SnapCore',
  
  CORS_ORIGINS: [
    isProduction ? 'https://snapcore.subspace.site' : (process.env.FRONTEND_SERVER_URL || 'http://localhost:5173'),
    'http://localhost:5174', 
    isProduction ? 'https://snapcore-fediverse.subspace.site' : (process.env.FEDIVERSE_SERVER_URL || 'http://localhost:4000')
  ]
} as const;

export const buildUserActorUrl = (username: string): string => {
  return `${URLS.BACKEND_BASE}/users/${username}`;
};

export const isLocalPost = (postUrl: string): boolean => {
  try {
    const url = new URL(postUrl);
    const localPort = process.env.PORT || '3000';
    
    return (
      (url.hostname === 'localhost' && url.port === localPort) ||
      url.hostname === process.env.DOMAIN || 
      url.hostname === 'snapcore.subspace' || 
      url.origin === URLS.BACKEND_BASE ||
      postUrl.includes('localhost:3000') 
    );
  } catch (error) {
    console.error('Error parsing post URL:', error);
    return false;
  }
};
