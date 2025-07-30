import { Request, Response, NextFunction } from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { formatErrorResponse } from "../utils/formatErrorResponse";
import { GoogleUserInfo } from "../types/AuthTypes";

declare module "express-session" {
  interface SessionData {
    user?: {
      googleId: string;
      userName: string;
      email: string;
    };
  }
}

dotenv.config();

export const handleGoogleAuthToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idToken = req.body.token as string | undefined;
    if (!idToken) {
      return next(formatErrorResponse(400, "Missing token parameter in request."));
    }

    const infoEndpoint = process.env.TOKEN_INFO;
    if (!infoEndpoint) {
      return next(formatErrorResponse(500, "TOKEN_INFO is not configured."));
    }

    const verifyRes = await fetch(`${infoEndpoint}?id_token=${idToken}`);
    const userInfo = (await verifyRes.json()) as GoogleUserInfo;

    if (userInfo.error) {
      return next(formatErrorResponse(400, `${userInfo.error}: ${userInfo.error_description}`));
    }

    req.session.user = {
      googleId: userInfo.sub,
      userName: userInfo.name,
      email: userInfo.email,
    };

    res.status(200).json({
      googleId: userInfo.sub,
      userName: userInfo.name,
      email: userInfo.email,
    });
  } catch (err: any) {
    return next(formatErrorResponse(500, err?.message || "Internal Server Error"));
  }
};

export const fetchGoogleUserInfo = async (idToken: string): Promise<GoogleUserInfo> => {
  try {
    const infoEndpoint = process.env.TOKEN_INFO;
    if (!infoEndpoint) {
      return {
        error: "TOKEN_INFO not set",
        error_description: "TOKEN_INFO endpoint missing in environment.",
        sub: "",
        name: "",
        email: "",
      };
    }
    const res = await fetch(`${infoEndpoint}?id_token=${idToken}`);
    const userInfo = (await res.json()) as GoogleUserInfo;
    return userInfo;
  } catch (err: any) {
    return {
      error: err.message,
      error_description: "Unexpected error during Google token verification.",
      sub: "",
      name: "",
      email: "",
    };
  }
};

export const getCurrentUser = (req: Request, res: Response) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ user: null });
  }
};

export const logout = (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
};