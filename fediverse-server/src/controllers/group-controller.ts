import { Request, Response } from 'express';
import {getCommunityFromGroup, getGroupFromCommunity} from '../utils/convert-activity-pub-objects';
import {requestBackendServer} from "../utils/backend-service";
import dotenv from 'dotenv';
import {Community} from "../shared/types/community";
import {getExternalServer} from "../utils/external-federated-service";
import {WebfingerResponse} from "../types/webfinger-response";
import {Group} from "../types/group";

dotenv.config();
const frontendServerUrl = new URL(process.env.FRONTEND_SERVER_URL as string);

export const getGroupByHandle = async (req: Request, res: Response) => {
  const handle = req.params.handle;

  if (!handle) {
    return res.status(400)
      .json({ error: 'Invalid get community request' });
  }

  let community : Community;
  try {
    community = await requestBackendServer(
      `communities/${handle}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/activity+json',
        },
      });
  } catch (error) {
    return res.status(500).json('Could not retrieve community from backend server')
  }

  if (!community) {
    return res.status(404).json({ error: 'Community not found' });
  }

  const acceptHeader = req.headers.accept || '';

  if (acceptHeader.includes('application/activity+json')) {
    const group = getGroupFromCommunity(community);
    res.setHeader('Content-Type', 'application/activity+json');
    return res.status(200).json(group);
  }

  return res.redirect(`${frontendServerUrl}community/${handle}`);
};

export const getExternalCommunityFromHandle = async (req: Request, res: Response) => {
  const { handle, domain } = req.query as { handle: string; domain: string };

  if (!handle || !domain) {
    return res.status(400).json({ error: 'Invalid get external community request' });
  }

  const webfingerResponse = await getExternalServer(new URL(`https://${domain}`), `.well-known/webfinger?resource=acct:${handle}@${domain}`);

  if (!webfingerResponse.ok) {
    return res.status(500).json({ error: 'Could not retrieve external group' });
  }

  const webfingerData : WebfingerResponse = await webfingerResponse.json();

  if (!webfingerData) {
    return res.status(500).json({ error: 'Could not deserialize webfinger response' });
  }

  const groupUrl = webfingerData.links.find(link => link.rel === 'self')?.href;

  if (!groupUrl) {
    return res.status(500).json({ error: 'Could not retrieve external group url' });
  }

  const groupResponse = await getExternalServer(new URL(groupUrl), '');

  if (!groupResponse.ok) {
    return res.status(500).json({ error: 'Could not retrieve group object information' });
  }

  const group : Group = await groupResponse.json();

  if (!group) {
    return res.status(500).json({ error: 'Could not deserialize group response' });
  }

  const community : Community = getCommunityFromGroup(group);

  res.setHeader('Content-Type', 'application/activity+json');
  res.status(200).json(community);
};