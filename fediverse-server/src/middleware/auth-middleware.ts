import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import jwt from 'jsonwebtoken';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET!;

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];

  if (isJwtAuthenticated(JWT_SECRET, authHeader)) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}

// todo: add check on fediverse server endpoints that are called by backend
export const isJwtAuthenticated = (jwtSecret: string, authHeader : string | undefined) => {
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    try {
      jwt.verify(token, jwtSecret);

      return true;
    } catch (err) {
      return false;
    }
  }

  return false;
}

export const token = (jwtSecret: string) => jwt.sign(
  {
    iss: 'fediverse-server',
    aud: 'backend-server',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 10,
  },
  jwtSecret
);