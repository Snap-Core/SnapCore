import { createHttpSignature } from "./http-signature";
import { URLS } from "../config/urls";
import { User } from "../types/user";

interface ActivityPubActor {
  id: string;
  inbox: string;
  endpoints?: {
    sharedInbox?: string;
  };
  publicKey?: {
    id: string;
    owner: string;
    publicKeyPem: string;
  };
}

export async function fetchActorObject(actorUrl: string): Promise<ActivityPubActor> {
  try {
    // Parse the URL to get username and domain
    const url = new URL(actorUrl);
    const pathParts = url.pathname.split('/');
    const username = pathParts[pathParts.length - 1];
    const domain = url.hostname;

    // If it's a local user, use our local API
    const backendUrl = new URL(URLS.BACKEND_BASE);
    if (domain === backendUrl.host || domain.includes('localhost')) {
      const apiUrl = `${URLS.BACKEND_BASE}/api/users/${username}`;
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/activity+json, application/ld+json',
          'Authorization': `Bearer ${process.env.JWT_SECRET}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch actor object: ${response.statusText}`);
      }

      const userData = await response.json();
      
      // Convert to ActivityPubActor format
      return {
        id: userData.actorUrl || actorUrl,
        inbox: userData.inbox || `${actorUrl}/inbox`,
        endpoints: {
          sharedInbox: userData.inbox || `${actorUrl}/inbox`
        },
        publicKey: userData.publicKey ? {
          id: `${actorUrl}#main-key`,
          owner: actorUrl,
          publicKeyPem: userData.publicKey
        } : undefined
      };
    }

    // For federated users, use the federated search service
    const apiUrl = `${URLS.BACKEND_BASE}/api/users/external?username=${encodeURIComponent(username)}&domain=${encodeURIComponent(domain)}`;
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/activity+json, application/ld+json',
        'Authorization': `Bearer ${process.env.JWT_SECRET}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch actor object: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching actor object:', error);
    throw error;
  }
}

export async function sendSignedRequest(url: string, body: any, currentUser: User) {
  const date = new Date().toUTCString();
  const targetUrl = new URL(url);
  const signature = await createHttpSignature({
    method: 'POST',
    path: targetUrl.pathname,
    host: targetUrl.host,
    date,
    currentUser
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Host': targetUrl.host,
      'Date': date,
      'Content-Type': 'application/activity+json',
      'Accept': 'application/activity+json, application/ld+json',
      'Signature': signature
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send signed request: ${error}`);
  }

  return response;
}

export function buildActorUrl(username: string): string {
  return `${URLS.BACKEND_BASE}/users/${username}`;
}
