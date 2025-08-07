import { Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';
import httpSignature from 'http-signature';

interface ActivityPubActor {
  publicKey?: {
    publicKeyPem: string;
    id: string;
    owner: string;
  };
}

export async function verifyHttpSignature(req: Request, res: Response, next: NextFunction) {

  if (!req.headers.signature) {
    return res.status(401).json({ error: 'Request not signed' });
  }

  let parsedSignature: any;
  try {
    parsedSignature = httpSignature.parse(req as any); 
  } catch (err) {
    return res.status(400).json({ error: 'Invalid HTTP Signature format' });
  }

  const keyId = parsedSignature.keyId;
  if (!keyId || typeof keyId !== 'string') {
    return res.status(400).json({ error: 'Missing keyId in signature' });
  }

  try {

    const actorRes = await fetch(keyId, {
      headers: { Accept: 'application/activity+json' }
    });

    if (!actorRes.ok) {
      return res.status(400).json({ error: 'Failed to fetch actor from keyId URL' });
    }

    const actorData = await actorRes.json() as ActivityPubActor;
    const pubKeyPem = actorData.publicKey?.publicKeyPem;

    if (!pubKeyPem) {
      return res.status(400).json({ error: 'Public key not found for actor' });
    }

    const verified = httpSignature.verify(parsedSignature, pubKeyPem);
    if (!verified) {
      return res.status(401).json({ error: 'Signature verification failed' });
    }

    return next();
  } catch (err) {
    return res.status(500).json({ error: 'Signature verification error' });
  }
}
