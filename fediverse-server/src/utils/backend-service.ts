import dotenv from 'dotenv';

dotenv.config();

const backendServerUrl = new URL(process.env.BACKEND_SERVER_URL as string);

export const getBackendServer = async (path: string) => {
  return await fetch(`${backendServerUrl}${path}`);
}