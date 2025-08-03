import { KMSClient, DecryptCommand } from '@aws-sdk/client-kms';

const kmsClient = new KMSClient({ region: 'af-south-1' });

export const decryptPrivateKey = async (encrypted: string): Promise<string> => {
  const result = await kmsClient.send(new DecryptCommand({
    CiphertextBlob: Buffer.from(encrypted.trim(), 'base64'),
  }));
  return  Buffer.from(result.Plaintext!).toString('utf-8');
}
