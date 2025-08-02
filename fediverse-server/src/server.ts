import express from "express";
import userRoutes from './routes/user-routes';
import webfingerRoutes from "./routes/webfinger-routes";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.use('/', webfingerRoutes);
app.use('/users', userRoutes);

app.listen(PORT, () => {
  console.log(`Federated server running on port ${PORT}`);
});
