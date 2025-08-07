import dotenv from 'dotenv';
import {token} from "../middleware/fediverseAuthMiddleware";
import { URLS } from '../enums/urls';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET!;

const fediverseServerUrl = new URL(URLS.FEDIVERSE);

export const requestFediverseServer = async (path: string, options : Record<string, string | Record<string, string>>) => {
  const headers : Record<string, string> = options.headers as Record<string, string> || {};

   options['Credentials']= 'include';
   headers['Authorization'] = `Bearer ${token(JWT_SECRET)}`;

   options.headers = headers;

  const response = await fetch(`${fediverseServerUrl}${path}`, options);

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  return await response.json();
}