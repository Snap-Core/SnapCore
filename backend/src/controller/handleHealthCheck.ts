import { Request, Response } from 'express';

export const handleHealthCheck = (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'SnapCore backend is running smoothly',
    timestamp: new Date().toISOString(),
  });
};