import { Request, Response, NextFunction } from "express";
import { isJwtAuthenticated } from "./fediverseAuthMiddleware";
import { LocalUser, FederatedUser } from "../types/user";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET!;

interface SessionUser {
  googleId: string;
  userName: string;
  email: string;
  profilePicUrl?: string;
  publicKey?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: LocalUser | FederatedUser;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = req.session?.user as SessionUser | undefined;
  const authHeader = req.headers['authorization'];

  // Check for JWT token (federated users)
  if (authHeader) {
    if (isJwtAuthenticated(JWT_SECRET, authHeader)) {
      const actorUrl = req.headers['actor'] as string;
      // For federated users, add minimal user info
      const federatedUser: FederatedUser = {
        fediverseId: actorUrl,
        username: actorUrl.split('/').pop() || '',
        displayName: req.headers['displayname'] as string || '',
        publicKey: req.headers['publickey'] as string || '',
        isFederated: true,
        domain: new URL(actorUrl).hostname,
        inbox: `${actorUrl}/inbox`
      };
      req.user = federatedUser;
      return next();
    }
    return res.status(401).json({ message: "Invalid token" });
  }

  // Check for local user
  if (user?.googleId && user?.userName && user?.email) {
    // Convert session user to User type
    const localUser: LocalUser = {
      googleId: user.googleId,
      userName: user.userName,
      username: user.userName,
      displayName: user.userName,
      email: user.email,
      fediverseId: `https://${process.env.DOMAIN}/users/${user.userName}`,
      profilePicUrl: user.profilePicUrl,
      publicKey: user.publicKey,
      isFederated: false
    };
    req.user = localUser;
    return next();
  }
  else if (isJwtAuthenticated(JWT_SECRET, authHeader)) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}