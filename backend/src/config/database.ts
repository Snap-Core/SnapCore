import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/SnapCore';

export const connectToDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to MongoDB at ${MONGO_URI}`);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};
