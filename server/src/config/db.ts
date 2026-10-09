import mongoose from 'mongoose';

let memoryServer: any = null;

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kabadiwala_connect';

  try {
    console.log(`[MongoDB] Attempting connection to: ${uri}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log('[MongoDB] Connected to standalone MongoDB database successfully.');
  } catch (err: any) {
    console.warn(`[MongoDB] Standalone connection failed (${err.message}). Starting embedded MongoDB...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'kabadiwala_connect',
        },
      });
      const memUri = memoryServer.getUri();
      console.log(`[MongoDB] Embedded MongoDB running at: ${memUri}`);
      await mongoose.connect(memUri);
      console.log('[MongoDB] Connected to embedded MongoDB successfully.');
    } catch (memErr: any) {
      console.error('[MongoDB] Failed to start embedded MongoDB:', memErr.message);
      throw memErr;
    }
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
}
