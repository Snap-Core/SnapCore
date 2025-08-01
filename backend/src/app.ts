import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import session from 'express-session';
import dotenv from 'dotenv';
import postRouter from './routes/post';
import path from 'path';

dotenv.config();

const app = express();
const PORT = 3000;

mongoose.connect('mongodb://localhost:27017/mastinstatok');

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || '',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24,
  },
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // serve media
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/posts', postRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
