import crypto from 'crypto';
import { Request } from 'express';
import { User } from '../types/user';
import { fetchActorObject } from './activitypub-utils';

interface SignatureParams {
  method: string;
  path: string;
  host: string;
  date: string;
  currentUser: User;
}

export async function createHttpSignature({
  method,
  path,
  host,
  date,
  currentUser
}: SignatureParams): Promise<string> {
  const requestTarget = `${method.toLowerCase()} ${path}`;
  const stringToSign = `(request-target): ${requestTarget}\nhost: ${host}\ndate: ${date}`;
  
  // Get the user's private key
  const privateKey = currentUser.privateKey;
  
  if (!privateKey) {
    throw new Error('No private key available for signing');
  }

  const signer = crypto.createSign('sha256');
  signer.update(stringToSign);
  const signature = signer.sign(privateKey, 'base64');

  const keyId = `${currentUser.actorUrl}#main-key`;
  
  return `keyId="${keyId}",algorithm="rsa-sha256",headers="(request-target) host date",signature="${signature}"`;
}

export async function verifyHttpSignature(req: Request): Promise<boolean> {
  try {
    const signature = req.headers.signature as string;
    if (!signature) {
      return false;
    }

    // Parse signature header
    const params = new Map(
      signature
        .split(',')
        .map(p => p.trim().split('='))
        .map(([k, v]) => [k, v.replace(/^"(.*)"$/, '$1')])
    );

    const keyId = params.get('keyId');
    const headers = params.get('headers')?.split(' ') || [];
    const sigString = params.get('signature');

    if (!keyId || !headers.length || !sigString) {
      return false;
    }

    // Fetch the actor's public key
    const actor = await fetchActorObject(keyId.split('#')[0]);
    if (!actor.publicKey?.publicKeyPem) {
      return false;
    }

    // Build the signing string
    const signingString = headers
      .map(header => {
        if (header === '(request-target)') {
          return `(request-target): ${req.method.toLowerCase()} ${req.path}`;
        }
        if (header === 'host') {
          return `host: ${req.headers.host}`;
        }
        if (header === 'date') {
          return `date: ${req.headers.date}`;
        }
        return `${header}: ${req.headers[header]}`;
      })
      .join('\n');

    // Verify signature
    const verify = crypto.createVerify('sha256');
    verify.update(signingString);
    return verify.verify(
      actor.publicKey.publicKeyPem,
      Buffer.from(sigString, 'base64')
    );
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}
