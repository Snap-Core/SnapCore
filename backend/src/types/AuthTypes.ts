export type GoogleUserInfo = {
  sub: string;
  name: string;
  email: string;
  error?: string;
  error_description?: string;
  [key: string]: any;
};

declare module "express-session" {
  interface SessionData {
    user?: {
      googleId: string;
      userName: string;
      email: string;
    };
  }
}