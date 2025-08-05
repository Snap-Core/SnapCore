import dotenv from 'dotenv';
import {token} from "../../../shared/middleware/auth-middleware";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET!;

const backendServerUrl = new URL(process.env.BACKEND_SERVER_URL as string);

export const requestBackendServer = async (path: string, options : Record<string, string | Record<string, string>>) => {
  const headers : Record<string, string> = options.headers as Record<string, string> || {};

   options['Credentials']= 'include';
   headers['Authorization'] = `Bearer ${token(JWT_SECRET)}`;

   options.headers = headers;

  const response = await fetch(`${backendServerUrl}${path}`, options);

  if (!response.ok) {
    throw new Error();
  }

  return await response.json();

}