import { Request, Response } from 'express';
import { getPersonFromUser } from '../utils/convert-to-activity-pub-objects';
import {User} from "../../../shared/types/user";

const internalServer = 'http://localhost:3000'; // todo: better way of getting internal server

export const getPersonFromUsername = async (req: Request, res: Response) => {
  const { username } = req.params;
  const response = await fetch(`${internalServer}/users/${username}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const user : User = await response.json();

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const actor = getPersonFromUser(user);

  res.setHeader('Content-Type', 'application/activity+json');
  return res.status(200).json(actor);
};