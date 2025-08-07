import { Request, Response } from 'express';
import {requestBackendServer} from "../utils/backend-service";
import dotenv from 'dotenv';
import { User } from '../types/user';
import { Community } from '../types/community';

dotenv.config();

const fediverseServerUrl = new URL(process.env.FEDIVERSE_SERVER_URL as string);
const fediverseDomain = fediverseServerUrl.hostname;

export const handleWebFinger = async (req: Request, res: Response) => {
  // todo: add discovery for groups

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

  let user : User|undefined;
  let community : Community|undefined;

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
  }

  try {
    community = await requestBackendServer(
      `community/${username}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/activity+json',
        },
      });
  } catch (error) {
  }

  if (!user && !community) {
    return res.status(404).json({ error: 'No User or Community found by that username' });
  }

  const isUser = !!user

  const actorUrl = `${fediverseServerUrl}${
    isUser ? 'users' : 'community'
  }/${
    isUser ? user?.username : community?.handle
  }`;

  res.setHeader('Content-Type', 'application/jrd+json');
  res.json({
    subject: `acct:${isUser ? user?.username : community?.handle}@${fediverseDomain}`,
    links: [
      {
        rel: 'self',
        type: 'application/activity+json',
        href: actorUrl
      }
    ]
  });
};
