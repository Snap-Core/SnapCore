import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { URLS } from '../enums/urls';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || URLS.MONGO_DB;

export const connectToDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to MongoDB at ${MONGO_URI}`);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};
