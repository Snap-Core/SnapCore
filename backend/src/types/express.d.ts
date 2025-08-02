declare namespace Express {
  export interface Request {
    actor?: string;
    user?: {
      googleId: string;
      userName: string;
      email: string;
    };
  }
}