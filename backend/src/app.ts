import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import healthRouter from './routes/health';
import postRouter from './routes/post';
import path from 'path';

const app = express();
const PORT = 3000;

mongoose.connect('mongodb://localhost:27017/mastinstatok');

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // serve media

app.use('/api/health', healthRouter);
app.use('/api/posts', postRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
