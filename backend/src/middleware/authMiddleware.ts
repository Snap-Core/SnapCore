import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = req.session?.user;
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
  return res.status(401).json({ error: "Unauthorized" });
}