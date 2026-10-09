import mongoose, { Schema, Document } from 'mongoose';

export interface ISyncEvent extends Document {
  clientId: string;
  lotId?: string;
  eventType: 'LOT_CREATE' | 'IMAGE_UPLOAD' | 'BATCH_SYNC';
  status: 'SUCCESS' | 'FAILED';
  errorMessage?: string;
  ipAddress?: string;
  timestamp: Date;
}

const SyncEventSchema: Schema = new Schema(
  {
    clientId: { type: String, required: true },
    lotId: { type: String },
    eventType: {
      type: String,
      enum: ['LOT_CREATE', 'IMAGE_UPLOAD', 'BATCH_SYNC'],
      default: 'LOT_CREATE',
    },
    status: { type: String, enum: ['SUCCESS', 'FAILED'], required: true },
    errorMessage: { type: String },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const SyncEvent = mongoose.model<ISyncEvent>('SyncEvent', SyncEventSchema);
