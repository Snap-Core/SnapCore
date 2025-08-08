import { KMSClient, EncryptCommand } from '@aws-sdk/client-kms';
import dotenv from "dotenv";

dotenv.config();

const KMS_ALIAS = process.env.KMS_ALIAS!;

const kmsClient = new KMSClient({ region: process.env.AWS_REGION });

export const encryptPrivateKey = async (privateKeyPem: string): Promise<string> => {
  const result = await kmsClient.send(new EncryptCommand({
    KeyId: KMS_ALIAS,
    Plaintext: Buffer.from(privateKeyPem,'utf-8'),
  }));

  return Buffer.from(result.CiphertextBlob!).toString('base64');

}

