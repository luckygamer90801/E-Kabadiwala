import mongoose, { Schema, Document } from 'mongoose';

export interface ICollector extends Document {
  collectorId: string; // e.g. "KC-COL-892"
  name: string;
  phone: string;
  preferredLanguage: 'en' | 'hi' | 'mr';
  stats: {
    totalLots: number;
    totalWeightKg: number;
    totalEstimatedValue: number;
  };
  isBanned: boolean;
  banReason?: string;
  banTimestamp?: Date;
  reportCount: number;
  severityScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const CollectorSchema: Schema = new Schema(
  {
    collectorId: { type: String, required: true, unique: true },
    name: { type: String, required: true, default: 'Ramesh Kumar' },
    phone: { type: String, required: true, unique: true },
    preferredLanguage: { type: String, enum: ['en', 'hi', 'mr'], default: 'hi' },
    stats: {
      totalLots: { type: Number, default: 0 },
      totalWeightKg: { type: Number, default: 0 },
      totalEstimatedValue: { type: Number, default: 0 },
    },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: '' },
    banTimestamp: { type: Date },
    reportCount: { type: Number, default: 0 },
    severityScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Collector = mongoose.model<ICollector>('Collector', CollectorSchema);
