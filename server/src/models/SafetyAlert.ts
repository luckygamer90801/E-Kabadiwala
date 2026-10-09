import mongoose, { Schema, Document } from 'mongoose';

export interface ISafetyAlert extends Document {
  alertId: string;
  category: string;
  severity: 'INFO' | 'WARNING' | 'HIGH';
  icon: string;
  titleEn: string;
  titleHi: string;
  bodyEn: string;
  bodyHi: string;
  dosEn: string[];
  dosHi: string[];
  dontsEn: string[];
  dontsHi: string[];
  voiceTextEn: string;
  voiceTextHi: string;
}

const SafetyAlertSchema: Schema = new Schema(
  {
    alertId: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    severity: { type: String, enum: ['INFO', 'WARNING', 'HIGH'], default: 'WARNING' },
    icon: { type: String, default: '⚠️' },
    titleEn: { type: String, required: true },
    titleHi: { type: String, required: true },
    bodyEn: { type: String, required: true },
    bodyHi: { type: String, required: true },
    dosEn: { type: [String], default: [] },
    dosHi: { type: [String], default: [] },
    dontsEn: { type: [String], default: [] },
    dontsHi: { type: [String], default: [] },
    voiceTextEn: { type: String, default: '' },
    voiceTextHi: { type: String, default: '' },
  },
  { timestamps: true }
);

export const SafetyAlert = mongoose.model<ISafetyAlert>('SafetyAlert', SafetyAlertSchema);
