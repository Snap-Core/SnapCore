import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export const URLS = {
  FEDIVERSE_BASE: isProduction ? 'https://snapcore-fediverse.subspace.site' : (process.env.FEDIVERSE_SERVER_URL || 'http://localhost:4000'),
  
  BACKEND_BASE: isProduction ? 'https://snapcore.subspace.site' : (process.env.BACKEND_SERVER_URL || 'http://localhost:3000'),
  
  FRONTEND_BASE: isProduction ? 'https://snapcore.subspace.site' : (process.env.FRONTEND_SERVER_URL || 'http://localhost:5173'),
} as const;

export const buildUserActorUrl = (username: string): string => {
  return `${URLS.FEDIVERSE_BASE}/users/${username}`;
};

export const buildBackendUserUrl = (username: string): string => {
  return `${URLS.BACKEND_BASE}/users/${username}`;
};
