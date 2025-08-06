import jwt from 'jsonwebtoken';

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