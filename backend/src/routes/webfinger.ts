import express from 'express';
import { Request, Response } from 'express';
import { findUserByUsername } from '../services/dynamoUserService';
import dotenv from 'dotenv';
import { URLS } from '../config/urls';

dotenv.config();

const router = express.Router();

const backendServerUrl = URLS.BACKEND_BASE || 'https://snapcore.subspace.site';

export const handleWebFinger = async (req: Request, res: Response) => {
  const resource = req.query.resource as string;

  if (!resource || !resource.startsWith('acct:')) {
    return res.status(400).json({ error: 'Invalid resource' });
  }

  const [username, domain] = resource.replace('acct:', '').split('@');

  if (!username || !domain) {
    return res.status(400).json({ error: 'Invalid actor request' });
  }

  const backendDomain = new URL(backendServerUrl).hostname;
  
  if (domain !== backendDomain) {
    return res.status(400).json({ error: 'Actor domain is not our domain' });
  }

  try {
    const user = await findUserByUsername(username);
    
    if (!user || !user.activated) {
      return res.status(404).json({ error: 'User not found' });
    }

    const actorUrl = `${backendServerUrl}/users/${username}`;

    res.setHeader('Content-Type', 'application/jrd+json');
    res.json({
      subject: `acct:${username}@${backendDomain}`,
      links: [
        {
          rel: 'self',
          type: 'application/activity+json',
          href: actorUrl
        }
      ]
    });

  } catch (error) {
    console.error('Error in webfinger lookup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

router.get('/.well-known/webfinger', handleWebFinger);

export default router;
