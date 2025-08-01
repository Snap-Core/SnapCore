import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';

import healthRouter from './routes/health';
import authRouter from './routes/auth';
import postRouter from './routes/post';
import { connectToDatabase } from './config/database';
import inboxRouter from './routes/inbox';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

connectToDatabase();


app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
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

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/posts', postRouter);
app.use('/inbox', inboxRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
