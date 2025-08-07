import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';

import healthRouter from './routes/health';
import authRouter from './routes/auth';
import postRouter from './routes/post';
import { connectToDatabase } from './config/database';
import inboxRouter from './routes/inbox';
import followRouter from './routes/follow';
import fedelikeRouter from './routes/federatedLikes';
import localLikeRouter from './routes/localLikes';
import userRouter from './routes/user';
import commentsRouter from './routes/comments';
import mediaRoutes from './routes/mediaRoutes';
import communityRoutes from "./routes/communityRoutes";
import { URLS } from './enums/urls';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

connectToDatabase();

const allowedOrigins = [URLS.APP, URLS.FEDIVERSE];

app.use((req, res, next) => {
  const origin = req.header('Origin');
  if (origin === URLS.FEDIVERSE) {
    cors({
      origin: URLS.FEDIVERSE,
      credentials: true,
    })(req, res, next);
  } else {
    cors({
      origin: allowedOrigins,
      credentials: true,
    })(req, res, next);
  }
});

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24,
  },
}));

app.use('/uploads', mediaRoutes);

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/posts', postRouter);
app.use('/inbox', inboxRouter);
app.use('/api/follow', followRouter);
app.use('/api/likes', fedelikeRouter);
app.use('/api/likes', localLikeRouter);
app.use('/api/users', userRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/community', communityRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on ${URLS.APP}:${PORT}`);
});
