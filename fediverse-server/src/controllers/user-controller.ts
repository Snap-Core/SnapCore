import { Request, Response } from 'express';
import {getPersonFromUser, getUserFromPerson} from '../utils/convert-activity-pub-objects';
import {User} from "../../../shared/types/user";
import {requestBackendServer} from "../utils/backend-service";
import {getExternalServer} from "../utils/external-federated-service";
import {WebfingerResponse} from "../types/webfinger-response";
import { Person } from '../types/person';
import dotenv from 'dotenv';

dotenv.config();
const frontendServerUrl = new URL(process.env.FRONTEND_SERVER_URL as string);

export const getPersonFromUsername = async (req: Request, res: Response) => {
  const username = req.params.username;

  if (!username) {
    return res.status(400)
      .json({ error: 'Invalid get user request' });
  }

  let user : User;
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

  return res.redirect(`${frontendServerUrl}profile/${username}`); // todo: confirm structure of url
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

  const webfingerData : WebfingerResponse = await webfingerResponse.json();

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

  const person : Person = await personResponse.json();

  if (!person) {
    return res.status(500).json({ error: 'Could not deserialize person response' });
  }

  const user : User = getUserFromPerson(person);

  res.setHeader('Content-Type', 'application/activity+json');
  res.status(200).json(user);
};