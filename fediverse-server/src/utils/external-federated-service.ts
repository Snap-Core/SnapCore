import crypto from 'crypto';
import { Request } from 'express';
import {decryptPrivateKey} from "./kms-decryption";

export const getExternalServer = async (
  baseUrl : URL,
  path : string = '',
  requestingActorUrl : URL | null = null,
  requestingActorEncryptedPrivateKey : string | null = null,
  requiresHttpSignature : boolean = false,
  method : string = 'GET',
  body : any = null) => {
  let headers : Record<string, string> = {
    Accept: 'application/activity+json, application/ld+json',
    Host: baseUrl.hostname,
    Date: new Date().toUTCString()
  };

  if (method === 'POST' && body) {
    headers['Content-Type'] = 'application/activity+json';
  }

  if (requiresHttpSignature) {
    if (!requestingActorUrl || !requestingActorEncryptedPrivateKey) {
    }

    const privateKey: string = await decryptPrivateKey(requestingActorEncryptedPrivateKey!)

    const fullUrl = path ? new URL(path, baseUrl) : baseUrl;
    headers = signRequest(
      fullUrl,
      method,
      headers,
      privateKey,
      requestingActorUrl!,
      body
    );
  }

  const fetchOptions: any = {
    method: method,
    headers: headers
  };

  if (method === 'POST' && body) {
    fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const fullUrl = path ? new URL(path, baseUrl).toString() : baseUrl.toString();
  
  const response = await fetch(fullUrl, fetchOptions);
    
  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Failed to fetch from ${baseUrl + path}: ${response.statusText}`);
  }
  return response;

}

export const signRequest = (
  url: URL,
  method: string,
  headers: Record<string, string>,
  privateKeyPem: string,
  actorUrl: URL,
  body?: any
): Record<string, string> => {
  const normalizedHeaders: Record<string, string> = {};
  Object.keys(headers).forEach(key => {
    normalizedHeaders[key.toLowerCase()] = headers[key];
  });
  
  normalizedHeaders['user-agent'] = 'SnapCore/1.0';
  
  const signingHeaders = ['(request-target)', 'host', 'date'];
  
  if (method === 'POST' && body) {
    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
    const digest = crypto.createHash('sha256').update(bodyString).digest('base64');
    normalizedHeaders['digest'] = `SHA-256=${digest}`;
    signingHeaders.push('digest');
  }

  const requestTarget = `${method.toLowerCase()} ${url.pathname}${url.search || ''}`;

  const signatureBase = signingHeaders
    .map((header) => {
      if (header === '(request-target)') {
        return `(request-target): ${requestTarget}`;
      }
      return `${header}: ${normalizedHeaders[header]}`;
    })
    .join('\n');

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureBase);
  signer.end();

  const signature = signer.sign(privateKeyPem, 'base64');

  
  const finalHeaders = { ...headers };
  finalHeaders['User-Agent'] = 'SnapCore/1.0';
  if (normalizedHeaders['digest']) {
    finalHeaders['Digest'] = normalizedHeaders['digest'];
  }  
  finalHeaders['Signature'] = `keyId="${actorUrl}#main-key",algorithm="rsa-sha256",headers="${signingHeaders.join(' ')}",signature="${signature}"`;

  return finalHeaders;
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
