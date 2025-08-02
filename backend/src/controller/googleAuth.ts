import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { formatErrorResponse } from "../utils/formatErrorResponse";
import { GoogleUserInfo } from "../types/AuthTypes";
import { createUserIfNotExists } from "../services/dynamoUserService";

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

    await createUserIfNotExists(userInfo);

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
