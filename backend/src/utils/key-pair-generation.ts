import { generateKeyPairSync } from 'crypto';
import {encryptPrivateKey} from "./kms-encryption";

export const generateKeyPairForActor = async (actorIdentifier : string) : Promise<[string, string]> => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  console.log('publicKey', publicKey);
  console.log('privateKey', privateKey);

  const encryptedPrivateKey : string = await encryptPrivateKey(privateKey, actorIdentifier );

  console.log('encryptedPrivateKey', encryptedPrivateKey);

  return [publicKey, encryptedPrivateKey];
}

