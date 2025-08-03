import { Request, Response, NextFunction } from "express";
import { updateUser } from "../services/dynamoUserService";

export const getCurrentUser = (req: Request, res: Response) => {
  if (!req.actor) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json({ actor: req.actor, user: req.user });
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

    if (!id || (!updates.name && !updates.email)) {
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