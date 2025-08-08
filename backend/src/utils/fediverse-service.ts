import dotenv from 'dotenv';
import {token} from "../middleware/fediverseAuthMiddleware";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET!;

const fediverseServerBaseUrl = (process.env.FEDIVERSE_SERVER_URL as string).replace(/\/$/, '');

export const requestFediverseServer = async (path: string, options: any = {}) => {
  const headers: Record<string, string> = options.headers as Record<string, string> || {};

  options.credentials = 'include';
  headers['Authorization'] = `Bearer ${token(JWT_SECRET)}`;

  options.headers = headers;

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = `${fediverseServerBaseUrl}${cleanPath}`;

  const response = await fetch(fullUrl, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText}`);
  }

  return await response.json();
}

export const notifyFediverseLike = async (likeData: {
  actor: string;
  object: string;
  activityPubObject: any;
}) => {
  try {
    const result = await requestFediverseServer('/activities/like', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(likeData),
    });
    
    return result;
  } catch (error) {
    console.error('Failed to notify fediverse server about like:', error);
    throw error;
  }
};

export const notifyFediverseUnlike = async (unlikeData: {
  actor: string;
  object: string;
}) => {
  try {
    return await requestFediverseServer('/activities/unlike', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(unlikeData),
    });
  } catch (error) {
    console.error('Failed to notify fediverse server about unlike:', error);
    throw error;
  }
};