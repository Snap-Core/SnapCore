import { Request, Response } from 'express';
import { getPersonFromUser } from '../utils/convert-activity-pub-objects';
import {User} from "../../../shared/types/user";
import {getBackendServer} from "../utils/backend-service";
import {getExternalServer, getExternalServerUrl} from "../utils/external-federated-service";
import {WebfingerResponse, WebfingerResponseLink} from "../types/webfinger-response";

export const getPersonFromUsername = async (req: Request, res: Response) => {
  const username = req.params.username;

  if (!username) {
    return res.status(400)
      .json({ error: 'Invalid get user request' });
  }

  const response = await getBackendServer(`users/${username}`);

  if (!response.ok) {
    return res.status(500).json({ error: 'Could not retrieve actor internally' });
  }

  const user : User = await response.json();
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const actor = getPersonFromUser(user);

  res.setHeader('Content-Type', 'application/activity+json');
  res.status(200).json(actor);
};

export const getExternalUserPageFromUsername = async (req: Request, res: Response) => {
  const { username, domain } = req.query;

  if (!username || !domain) {
    return res.status(400).json({ error: 'Invalid get user request' });
  }

  const webfingerResponse = await getExternalServer(domain, `.well-known/webfinger?resource=acct:${username}@${domain}`);

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

  res.setHeader('Content-Type', 'application/activity+json');
  res.status(200).json(personUrl);
};