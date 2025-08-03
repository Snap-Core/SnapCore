import { KMSClient, EncryptCommand } from '@aws-sdk/client-kms';

const kmsClient = new KMSClient({ region: 'af-south-1' });

export const encryptPrivateKey = async (privateKeyPem: string, actorIdentifier : string): Promise<string> => {
  const result = await kmsClient.send(new EncryptCommand({
    KeyId: actorIdentifier,
    Plaintext: Buffer.from(privateKeyPem),
  }));

  return result.CiphertextBlob!.toLocaleString('base64');
}

