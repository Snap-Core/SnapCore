import { Request, Response, NextFunction } from "express";
import {isJwtAuthenticated} from "../../../shared/middleware/auth-middleware";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET!;

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];

  if (isJwtAuthenticated(JWT_SECRET, authHeader)) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}