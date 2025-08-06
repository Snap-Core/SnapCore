import { Request, Response } from 'express';
import {getGroupFromCommunity} from '../utils/convert-activity-pub-objects';
import {requestBackendServer} from "../utils/backend-service";
import dotenv from 'dotenv';
import {Community} from "../shared/types/community";

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

  return res.redirect(`${frontendServerUrl}community/${handle}`); // todo: confirm structure of url
};

export const getExternalCommunityFromUsername = async (req: Request, res: Response) => {
  // todo
};