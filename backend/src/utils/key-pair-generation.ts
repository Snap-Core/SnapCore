import { generateKeyPairSync } from 'crypto';
import {encryptPrivateKey} from "./kms-encryption";

export const generateKeyPair = async () : Promise<[string, string]> => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const encryptedPrivateKey : string = await encryptPrivateKey(privateKey);

  return [publicKey, encryptedPrivateKey];
}

