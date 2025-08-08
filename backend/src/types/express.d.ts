import { LocalUser, FederatedUser } from './user';

declare namespace Express {
  export interface Request {
    actor?: string;
    user?: LocalUser | FederatedUser;
  }
}

declare module 'express-session' {
  interface SessionData {
    user?: LocalUser | FederatedUser;
  }
}