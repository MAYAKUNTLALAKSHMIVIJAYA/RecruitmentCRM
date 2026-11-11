import mongoose from 'mongoose';
import { config } from './config';

export const connectDB = async (): Promise<void> => {
  try {
    console.log(`[DB] Attempting to connect to MongoDB: ${config.mongoUri}`);
    // Set a short serverSelectionTimeoutMS so we don't hang if no local mongod
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log('[DB] Successfully connected to MongoDB database');
  } catch (err: any) {
    console.warn(`[DB] Local MongoDB connection failed (${err.message}). Initializing embedded MongoMemoryServer...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create({
        instance: {
          dbName: 'recruitflow',
        },
      });
      const uri = mongod.getUri();
      console.log(`[DB] Embedded MongoMemoryServer started at ${uri}`);
      await mongoose.connect(uri);
      console.log('[DB] Successfully connected to embedded MongoMemoryServer');
    } catch (memoryErr: any) {
      console.error('[DB] Fatal: Failed to initialize database:', memoryErr);
      throw memoryErr;
    }
  }
};
