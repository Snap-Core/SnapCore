import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health';

const app = express();
const PORT = 3000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use('/api/health', healthRouter);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});