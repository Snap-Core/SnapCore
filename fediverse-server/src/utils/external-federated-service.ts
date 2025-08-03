import crypto from 'crypto';
import { Request } from 'express';

export const getExternalServer = async (
  baseUrl : URL,
  path : string = '',
  requestingActorUrl : URL | null = null,
  requiresHttpSignature : boolean = false) => {
  let headers : Record<string, string> = {
    Accept: 'application/activity+json',
    Host: baseUrl.toString(),
    Date: new Date().toISOString()
  };

  if (requiresHttpSignature) {
    if (!requestingActorUrl) {
      // todo: throw error / do not allow
    }

    headers = signRequest(
      new URL(baseUrl, path),
      'GET',
      headers,
      'privateKey', // todo: create private key
      requestingActorUrl as URL
    );
  }

  return await fetch(`${baseUrl + path}`, {
    headers: headers
  });

  // todo: add toJson before return and throw error here?
}

export const signRequest = (
  url: URL,
  method: string,
  headers: Record<string, string>,
  privateKeyPem: string,
  actorUrl: URL
): Record<string, string> => {
  const signingHeaders = ['(request-target)', 'host', 'date'];

  const requestTarget = `${method.toLowerCase()} ${url.pathname}`;

  const signatureBase = signingHeaders
    .map((header) => {
      if (header === '(request-target)') {
        return `(request-target): ${requestTarget}`;
      }
      return `${header}: ${headers[header]}`;
    })
    .join('\n');

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureBase);
  signer.end();

  const signature = signer.sign(privateKeyPem, 'base64');

  headers['Signature'] = `keyId="${actorUrl}#main-key",algorithm="rsa-sha256",headers="${signingHeaders.join(' ')}",signature="${signature}"`;

  return headers;
}


export async function verifySignature(
  req: Request
): Promise<boolean> {
  const signatureHeader = req.headers['signature'];
  if (!signatureHeader || typeof signatureHeader !== 'string') return false;

  const signatureParams = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const [key, value] = part.split('=');
      return [key.trim(), value.replace(/"/g, '')];
    })
  );

  const actorUrl = signatureParams['keyId'].split('#')[0];
  const actorRes = await fetch(actorUrl, {
    headers: { Accept: 'application/activity+json' },
  });
  const actor = await actorRes.json(); // todo: use getExternalServer method
  const publicKeyPem = actor.publicKey?.publicKeyPem;
  if (!publicKeyPem) return false;

  const headersToVerify = signatureParams['headers'].split(' ');
  const signatureBase = headersToVerify
    .map((header) => {
      if (header === '(request-target)') {
        return `(request-target): ${req.method.toLowerCase()} ${req.originalUrl}`;
      }
      return `${header}: ${req.headers[header]}`;
    })
    .join('\n');

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(signatureBase);
  verifier.end();

  return verifier.verify(publicKeyPem, signatureParams['signature'], 'base64');
}
