import { Request, Response } from 'express';
import {User} from "../../../shared/types/user";
import {getBackendServer} from "../utils/backend-service";

const fediverseServerUrl = 'http://localhost:4000'; // todo: better way of getting internal server
const fediverseDomain = fediverseServerUrl.split('//')[1];


export const handleWebFinger = async (req: Request, res: Response) => {
  const resource = req.query.resource as string;

  if (!resource || !resource.startsWith('acct:')) {
    return res.status(400).json({ error: 'Invalid resource' });
  }

  const [username, domain] = resource.replace('acct:', '').split('@');

  if (!username || !domain) {
    return res.status(400).json({ error: 'Invalid actor request' });
  }

  if (domain != fediverseDomain) {
    return res.status(400).json({ error: 'Actor domain is not our domain' });
  }

  const response = await getBackendServer(`users/${username}`);

  if (!response.ok) {
    return res.status(500).json({ error: 'Could not retrieve actor internally' });
  }

  const user : User = await response.json();

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const actorUrl = `${fediverseServerUrl}/users/${user.username}`;

  res.setHeader('Content-Type', 'application/jrd+json');
  res.json({
    subject: `acct:${user.username}@${fediverseDomain}`,
    links: [
      {
        rel: 'self',
        type: 'application/activity+json',
        href: actorUrl
      }
    ]
  });
};
