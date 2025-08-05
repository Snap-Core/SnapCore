import { Request, Response, NextFunction } from "express";
import { findUserById, updateUser, scanUsers, findUserByUsername, searchUsersByQuery } from "../services/dynamoUserService";

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
  const user = await findUserByUsername(username);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const { id, email, encryptedPrivateKey, ...rest } = user;
  res.json({ user: rest });
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { q: query, limit = 20 } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: "Search query required" });
    }

    const users = await searchUsersByQuery(query, Number(limit));
    res.json({ users, query });
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
};