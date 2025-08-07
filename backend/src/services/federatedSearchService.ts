import { User } from "../types/user";
import { requestFediverseServer } from "../utils/fediverse-service";
import { User } from "../types/user";

export const searchFederatedUsers = async (query: string): Promise<User[]> => {
  try {
    const knownDomains = ['mastodon.social', 'fosstodon.org', 'hachyderm.io'];
    const results: User[] = [];

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

async function fetchExternalUser(username: string, domain: string): Promise<User | null> {
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

    return {
      fediverseId: actorData.id || `https://${domain}/users/${username}`,
      username,
      displayName: actorData.name || actorData.preferredUsername || username,
      summary: actorData.summary,
      profilePicUrl: actorData.icon?.url || '',
      publicKey: actorData.publicKey?.publicKeyPem || '',
      inbox: actorData.inbox,
      outbox: actorData.outbox,
      followers: actorData.followers,
      following: actorData.following,
      followersCount: actorData.followersCount || 0,
      followingCount: actorData.followingCount || 0,
      domain,
      isFederated: true
    };
  } catch (error) {
    console.log(`Failed to fetch ${username}@${domain}:`, error);
    return null;
  }
}