import { Request, Response, NextFunction } from "express";
import { findUserById, updateUser, scanUsers, findUserByUsername, searchUsersByQuery } from "../services/dynamoUserService";
import {User} from "../types/user";
import dotenv from "dotenv";
import {requestFediverseServer} from "../utils/fediverse-service";
import {searchFederatedUsers} from "../services/federatedSearchService";

dotenv.config();

const backendServerUrl = new URL(process.env.BACKEND_SERVER_URL as string);

export const getCurrentUser = async (req: Request, res: Response) => {
  if (!req.user?.googleId) {
    return res.status(404).json({ error: "User is a required field" });
  }
  const user = await findUserById(req.user.googleId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({ user });
};

export const logout = (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
};

export const updateUserController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.user?.googleId;
    const updates = req.body;

    if (!id || (!updates.name && !updates.email && !updates.displayName && !updates.username && !updates.summary && typeof updates.activated !== "boolean")) {
      return res.status(400).json({ error: "Missing user id or update fields." });
    }

    const updated = await updateUser(id, updates);
    if (!updated) {
      return res.status(404).json({ error: "User not found or no fields to update." });
    }

    res.json({ actor: req.actor, user: updated });
  } catch (err) {
    next(err);
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await scanUsers();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const getUserByUsername = async (req: Request, res: Response) => {
  const username = req.params.username;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const user = await findUserByUsername(username);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { id, email, ...rest } = user;

    res.json({...rest, fediverseId: `${backendServerUrl}users/${username}`} as User);
  } catch (error) {
    console.error("Error fetching user by username:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

export const getExternalUserFromUsername = async (req: Request, res: Response) => {
  const { username, domain } = req.query as { username: string; domain: string };

  if (!username || !domain) {
    return res.status(400).json({ error: 'Invalid get user request' });
  }

  let user : User;
  try {
    user = await requestFediverseServer(
      `users/external?username=${username}&domain=${domain}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/activity+json',
        },
      });
  } catch (error) {
    return res.status(500).json('Could not retrieve user from fediverse server: ' + error);
  }

  res.setHeader('Content-Type', 'application/activity+json');
  res.status(200).json(user);
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { q: query, limit = 20, includeFederated = 'true' } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: "Search query required" });
    }

    if (query.trim().length < 2) {
      return res.json({ 
        users: [], 
        federatedUsers: [],
        query, 
        message: "Query too short"
      });
    }

    const localUsers = await searchUsersByQuery(query.trim(), Number(limit));
    
    let federatedUsers: User[] = [];
    if (includeFederated === 'true') {
      federatedUsers = await searchFederatedUsers(query.trim());
    }

    res.json({ 
      users: localUsers,
      federatedUsers,
      query,
      localCount: localUsers.length,
      federatedCount: federatedUsers.length,
      message: (localUsers.length === 0 && federatedUsers.length === 0) 
        ? "No users found" 
        : undefined
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
};