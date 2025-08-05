import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';

import healthRouter from './routes/health';
import authRouter from './routes/auth';
import postRouter from './routes/post';
import { connectToDatabase } from './config/database';
import inboxRouter from './routes/inbox';
import fedelikeRouter from './routes/federatedLikes';
import localLikeRouter from './routes/localLikes';
import userRouter from './routes/user';
import mediaRoutes from './routes/mediaRoutes';
import {Community} from "../../shared/types/community";
import {generateKeyPair} from "./utils/key-pair-generation";
import {requireAuth} from "./middleware/authMiddleware";
import communityRoutes from "./routes/communityRoutes";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

connectToDatabase();

const allowedOrigins = ['http://localhost:5173', 'http://localhost:4000'];

app.use((req, res, next) => {
  const origin = req.header('Origin');
  if (origin === 'http://localhost:4000') {
    cors({
      origin: 'http://localhost:4000',
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
app.use('/api/likes', fedelikeRouter);
app.use('/api/likes', localLikeRouter);
app.use('/api/users', userRouter);
app.use('/api/community', communityRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
