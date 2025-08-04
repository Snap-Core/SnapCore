import { Request, Response, NextFunction } from "express";
import {isJwtAuthenticated} from "../../../shared/middleware/auth-middleware";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET!;

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = req.session?.user;
  const authHeader = req.headers['authorization'];

  if (
    user &&
    typeof user.googleId === "string" &&
    typeof user.userName === "string" &&
    typeof user.email === "string" &&
    user.googleId.length > 0 &&
    user.email.length > 0
  ) {
    req.user = user;
    return next();
  }
  else if (isJwtAuthenticated(JWT_SECRET, authHeader)) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}