"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
const mongoose_1 = __importDefault(require("mongoose"));
let memoryServer = null;
async function connectDB() {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kabadiwala_connect';
    try {
        console.log(`[MongoDB] Attempting connection to: ${uri}`);
        await mongoose_1.default.connect(uri, {
            serverSelectionTimeoutMS: 2500,
        });
        console.log('[MongoDB] Connected to standalone MongoDB database successfully.');
    }
    catch (err) {
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
            await mongoose_1.default.connect(memUri);
            console.log('[MongoDB] Connected to embedded MongoDB successfully.');
        }
        catch (memErr) {
            console.error('[MongoDB] Failed to start embedded MongoDB:', memErr.message);
            throw memErr;
        }
    }
}
async function disconnectDB() {
    await mongoose_1.default.disconnect();
    if (memoryServer) {
        await memoryServer.stop();
    }
}
