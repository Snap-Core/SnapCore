import { User, FederatedUser } from "../types/user";
import { requestFediverseServer } from "../utils/fediverse-service";

export const searchFederatedUsers = async (query: string): Promise<FederatedUser[]> => {
  try {
    const knownDomains = ['mastodon.social', 'fosstodon.org', 'hachyderm.io'];
    const results: FederatedUser[] = [];

    for (const domain of knownDomains) {
      try {
        if (query.includes('@')) {
          const lastAtIndex = query.lastIndexOf('@');
          let username = query.substring(0, lastAtIndex).replace(/^@+/, '');
          const searchDomain = query.substring(lastAtIndex + 1);
          if (username && searchDomain) {
            const user = await fetchExternalUser(username, searchDomain);
            if (user) results.push(user);
          }
          break;
        } else {
          const user = await fetchExternalUser(query, domain);
          if (user) results.push(user);
        }
      } catch (error) {
        console.log(`Failed to search ${domain}:`, error);
      }
    }

    return results;
  } catch (error) {
    console.error('Federated search failed:', error);
    return [];
  }
};

export async function fetchExternalUser(username: string, domain: string): Promise<FederatedUser | null> {
  try {
    const actorData = await requestFediverseServer(
      `users/external?username=${encodeURIComponent(username)}&domain=${encodeURIComponent(domain)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/activity+json',
        },
      }
    );

    if (!actorData) {
      console.log(`No data found for ${username}@${domain}`);
      return null;
    }

    const actorUrl = actorData.id || `https://${domain}/users/${username}`;
    
    // Try to fetch followers count if available
    let followersCount;
    if (actorData.followers && typeof actorData.followers === 'string') {
      try {
        const followersData = await requestFediverseServer(
          `users/followers/count?username=${encodeURIComponent(username)}&domain=${encodeURIComponent(domain)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/activity+json',
            },
          }
        );
        followersCount = followersData.count;
      } catch (error) {
        console.log('Failed to fetch followers count:', error);
      }
    }

    return {
      fediverseId: actorUrl,
      username,
      displayName: actorData.name || actorData.preferredUsername || username,
      summary: actorData.summary || '',
      profilePicUrl: actorData.icon?.url || '',
      publicKey: actorData.publicKey?.publicKeyPem || '',
      actorUrl,
      domain,
      isFederated: true,
      inbox: actorData.inbox || `${actorUrl}/inbox`,
      outbox: actorData.outbox || `${actorUrl}/outbox`,
      followers: actorData.followers || `${actorUrl}/followers`,
      following: actorData.following || `${actorUrl}/following`,
      followersCount: followersCount || 0
    };
  } catch (error) {
    console.log(`Failed to fetch ${username}@${domain}:`, error);
    return null;
  }
}

export async function fetchExternalUserOutbox(outbox: string): Promise<any | null> {
    try {
        const data = await requestFediverseServer(
            `users/outbox?outbox=${encodeURIComponent(outbox)}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/activity+json',
                },
            }
        );
        return data;
    } catch (error) {
        console.log('Failed to fetch outbox:', error);
        return null;
    }
}
