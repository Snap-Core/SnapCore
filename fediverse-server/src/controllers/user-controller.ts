import { Request, Response } from 'express';
import { getPersonFromUser, getUserFromPerson } from '../utils/convert-activity-pub-objects';
import { User } from "../types/user";
import { requestBackendServer } from "../utils/backend-service";
import { getExternalServer } from "../utils/external-federated-service";
import { WebfingerResponse } from "../types/webfinger-response";
import { Person } from '../types/person';
import dotenv from 'dotenv';
import { FollowPageResponse } from "../types/follow-page-response";
import { FollowResponse } from "../types/follow-response";
import {OutboxResponse} from "../types/outbox-response";
import {OutboxPageResponse} from "../types/outbox-page-response";

dotenv.config();
const frontendServerUrl = new URL(process.env.FRONTEND_SERVER_URL as string);
const fediverseServerUrl = new URL(process.env.FEDIVERSE_SERVER_URL as string);

const fetchCollectionCount = async (url: string): Promise<number> => {
  try {
    const response = await getExternalServer(new URL(url), '');

    if (!response.ok) {
      return 0;
    }

    const collection = await response.json();

    const count = collection.totalItems || collection.total || 0;

    return count;
  } catch (error) {
    return 0;
  }
};

export const getPersonFromUsername = async (req: Request, res: Response) => {
  const username = req.params.username;

  if (!username) {
    return res.status(400)
      .json({ error: 'Invalid get user request' });
  }

  let user: User;
  try {
    user = await requestBackendServer(
      `users/${username}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/activity+json',
        },
      });
  } catch (error) {
    return res.status(500).json('Could not retrieve user from backend server')
  }

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const acceptHeader = req.headers.accept || '';

  if (acceptHeader.includes('application/activity+json')) {
    const actor = getPersonFromUser(user);
    res.setHeader('Content-Type', 'application/activity+json');
    return res.status(200).json(actor);
  }

  return res.redirect(`${frontendServerUrl}profile/${username}`);
};

export const getExternalUserFromUsername = async (req: Request, res: Response) => {
  const { username, domain } = req.query as { username: string; domain: string };

  if (!username || !domain) {
    return res.status(400).json({ error: 'Invalid get user request' });
  }

  const webfingerResponse = await getExternalServer(new URL(`https://${domain}`), `.well-known/webfinger?resource=acct:${username}@${domain}`);

  if (!webfingerResponse.ok) {
    return res.status(500).json({ error: 'Could not retrieve external actor' });
  }

  const webfingerData: WebfingerResponse = await webfingerResponse.json();

  if (!webfingerData) {
    return res.status(500).json({ error: 'Could not deserialize webfinger response' });
  }

  const personUrl = webfingerData.links.find(link => link.rel === 'self')?.href;

  if (!personUrl) {
    return res.status(500).json({ error: 'Could not retrieve person url' });
  }

  const personResponse = await getExternalServer(new URL(personUrl), '');

  if (!personResponse.ok) {
    return res.status(500).json({ error: 'Could not retrieve person object information' });
  }

  const person: Person = await personResponse.json();

  if (!person) {
    return res.status(500).json({ error: 'Could not deserialize person response' });
  }

  const user: User = getUserFromPerson(person);

  let followersCount = 0;
  let followingCount = 0;

  if (person.followers) {
    followersCount = await fetchCollectionCount(person.followers);
  }

  if (person.following) {
    followingCount = await fetchCollectionCount(person.following);
  }

  const userWithCounts = {
    ...user,
    followersCount,
    followingCount,
    followersUrl: person.followers,
    followingUrl: person.following
  };

  res.setHeader('Content-Type', 'application/activity+json');
  res.status(200).json(userWithCounts);
};

export const searchExternalUsers = async (req: Request, res: Response) => {
  const { query, domains } = req.body as { query: string; domains: string[] };

  if (!query || !domains || domains.length === 0) {
    return res.status(400).json({ error: 'Query and domains required' });
  }

  const results = [];

  for (const domain of domains) {
    try {
      const webfingerResponse = await getExternalServer(
        new URL(`https://${domain}`),
        `.well-known/webfinger?resource=acct:${query}@${domain}`
      );

      if (webfingerResponse.ok) {
        const webfingerData: WebfingerResponse = await webfingerResponse.json();
        const personUrl = webfingerData.links.find(link => link.rel === 'self')?.href;

        if (personUrl) {
          const actorResponse = await getExternalServer(new URL(personUrl), '');
          if (actorResponse.ok) {
            const actorData = await actorResponse.json();

            let followersCount = 0;
            let followingCount = 0;

            if (actorData.followers) {
              followersCount = await fetchCollectionCount(actorData.followers);
            }

            if (actorData.following) {
              followingCount = await fetchCollectionCount(actorData.following);
            }

            results.push({
              username: query,
              domain,
              actor: actorData,
              followersCount,
              followingCount,
              source: 'webfinger'
            });
          }
        }
      }
    } catch (error) {
    }
  }

  res.json({ results, query, searchedDomains: domains });
};



export const getUserOutbox = async (req: Request, res: Response) => {
  const { outbox } = req.query as { outbox: string };

  if (!outbox) {
    return res.status(400).json({ error: 'Invalid outbox request' });
  }

  const response = await getExternalServer(new URL(outbox));

  if (!response.ok) {
    return res.status(500).json({ error: 'Could not retrieve inbox' });
  }

  const data = await response.json();

  if (!data) {
    return res.status(500).json({ error: 'Could not deserialize response' });
  }

  if ((data.orderedItems && data.orderedItems.length) || data.totalItems > 0) {
    let items: any[];
    if (data.orderedItems) {
      items = data.orderedItems;
    } else {
      const dataResponse = await getExternalServer(new URL(data.first));
      items = [];
      if (dataResponse.ok) {
        const outboxData = await dataResponse.json();
        items.push(...outboxData.orderedItems);
      }
    }
    if (items && items.length) {
      res.setHeader('Content-Type', 'application/activity+json');
      res.status(200).json({ items: items });
      return;
    } else {
      return res.status(500).json({ error: 'Could not fetch outbox items' });
    }
  }

  res.setHeader('Content-Type', 'application/activity+json');
  res.status(200).json(data);

};

export const getPersonFollowFromBackend = async (username: string, acceptHeader: string, isFollowing: boolean, page: number | null = null) => {

  const personUrl = `${fediverseServerUrl}users/${username}`;
  const encodedPersonUrl = encodeURIComponent(personUrl);
  const path = isFollowing ? 'following' : 'followers';

  const totalItems = (await requestBackendServer(
    `inbox/${encodedPersonUrl}/${path}/count`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/activity+json',
      },
    })).count;

  const followList = page
    ? await requestBackendServer(
      `inbox/${encodedPersonUrl}/${path}?page=${page}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/activity+json',
        },
      })
    : [];

  return page
    ? {
      "@context": "https://www.w3.org/ns/activitystreams",
      id: `${personUrl}/${path}?page=${page}`,
      type: "OrderedCollectionPage",
      totalItems: totalItems,
      next: totalItems / 10.0 >= page ? `${personUrl}/${path}?page=${page + 1}` : '',
      partOf: `${personUrl}/${path}`,
      orderedItems: followList,
    } as FollowPageResponse
    : {
      "@context": "https://www.w3.org/ns/activitystreams",
      id: `${personUrl}/${path}`,
      type: "OrderedCollection",
      totalItems: totalItems,
      first: `${personUrl}/${path}?page=1`,
    } as FollowResponse;
}

export const getPersonFollowingByUsername = async (req: Request, res: Response) => {
  const username = req.params.username;
  const page = Number(req.query.page);

  if (!username) {
    return res.status(400).json({ error: 'Invalid get following request. Requires username' });
  }

  const acceptHeader = req.headers.accept || '';

  if (acceptHeader.includes('application/activity+json')) {

    try {
      const response = await getPersonFollowFromBackend(username, acceptHeader, true, page);

      return res.status(200).json(response);
    } catch (error) {
      return res.status(500).json({ error: 'Could not retrieve following request from backend server' + error });
    }
  }
  return res.redirect(`${frontendServerUrl}profile/${username}/following${page ? `?page=${page}` : ''}`);
}

export const getPersonFollowersByUsername = async (req: Request, res: Response) => {
  const username = req.params.username;
  const page = Number(req.query.page);

  if (!username) {
    return res.status(400).json({ error: 'Invalid get followers request. Requires username' });
  }

  const acceptHeader = req.headers.accept || '';

  if (acceptHeader.includes('application/activity+json')) {

    try {
      const response = await getPersonFollowFromBackend(username, acceptHeader, false, page);

      return res.status(200).json(response);
    } catch (error) {
      return res.status(500).json({ error: 'Could not retrieve followers request from backend server' + error });
    }
  }
  return res.redirect(`${frontendServerUrl}profile/${username}/followers${page ? `?page=${page}` : ''}`);
}

export const handleInboxPost = async (req: Request, res: Response) => {
  try {
    return await requestBackendServer(
      `inbox`,
      {
        method: 'POST',
        body: JSON.stringify({...req.body, recipient: `${fediverseServerUrl}users/${req.params.username}`}),
      });
  } catch (error) {
    return res.status(500).json('Could not handle inbox post in backend server')
  }
}

export const getOutbox = async (req: Request, res: Response) => {
  // todo get likes?
  const username = req.params.username;
  const {page, min_id, max_id} = req.query;

  const personUrl = `${fediverseServerUrl}users/${username}`;
  const encodedPersonUrl = encodeURIComponent(personUrl);

  const queryParams = []

  if (page) {
    queryParams.push(`page=true`);
    if (min_id) {
      queryParams.push(`min_id=${min_id}`);
    }
    if(max_id) {
      queryParams.push(`max_id=${max_id}`);
    }
  }

  try {
    const response = await requestBackendServer(
      `posts/${encodedPersonUrl}${page ? `?${queryParams.join('&')}` : ''}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/activity+json',
        }
      });

    if (!page)
    {
      const {totalItems, oldestPostId} = response;

      return res.status(200).json(getOutboxResponse(personUrl, totalItems, oldestPostId));
    }

    return res.status(200).json(getOutboxPageResponse(personUrl, queryParams, response.posts));

  } catch (error) {
    return res.status(500).json('Could not handle get outbox in backend server')
  }
}

const getOutboxResponse = (
  personUrl : string,
  totalItems : number,
  oldestPostId : string) => {


  return {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `${personUrl}/outbox`,
    type: "OrderedCollection",
    totalItems: totalItems,
    first: `${personUrl}/outbox?page=true`,
    last: `${personUrl}/outbox?min_id=${oldestPostId}?page=true`
  } as OutboxResponse;
}

const getOutboxPageResponse = (
  personUrl : string,
  queryParams: string[],
  posts : any[] ) => {

  if (posts.length === 0) {
    return   {
      "@context": "https://www.w3.org/ns/activitystreams",
      id: `${personUrl}/outbox?${queryParams.join('&')}`,
      type: "OrderedCollectionPage",
      partOf: `${personUrl}/outbox`,
      orderedItems: posts
    } as OutboxPageResponse
  }

  const maxId : string = posts[posts.length - 1]['_id'];
  const minId : string = posts[0]['_id'];

  return   {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `${personUrl}/outbox?${queryParams.join('&')}`,
    type: "OrderedCollectionPage",
    next: `${personUrl}/outbox?max_id=${maxId}&page=true`,
    prev: `${personUrl}/outbox?min_id=${minId}&page=true`,
    partOf: `${personUrl}/outbox`,
    orderedItems: posts
  } as OutboxPageResponse;
}