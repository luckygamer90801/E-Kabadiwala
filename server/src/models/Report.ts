import mongoose, { Schema, Document } from 'mongoose';

export type ReportSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'SEVERE';

export interface IReport extends Document {
  reportId: string;
  reporterType: 'COLLECTOR' | 'BUYER';
  reporterId: string;
  reporterName: string;
  targetType: 'COLLECTOR' | 'BUYER';
  targetId: string;
  targetName: string;
  lotId?: string;
  category: string;
  severity: ReportSeverity;
  severityPoints: number;
  description: string;
  proofImages: string[];
  status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED';
  actionTaken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema(
  {
    reportId: { type: String, required: true, unique: true, index: true },
    reporterType: { type: String, required: true, enum: ['COLLECTOR', 'BUYER'] },
    reporterId: { type: String, required: true, index: true },
    reporterName: { type: String, required: true },
    targetType: { type: String, required: true, enum: ['COLLECTOR', 'BUYER'] },
    targetId: { type: String, required: true, index: true },
    targetName: { type: String, required: true },
    lotId: { type: String },
    category: { type: String, required: true },
    severity: {
      type: String,
      required: true,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'SEVERE'],
      default: 'MEDIUM',
    },
    severityPoints: { type: Number, required: true, default: 2 },
    description: { type: String, required: true },
    proofImages: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['ACTIVE', 'RESOLVED', 'DISMISSED'],
      default: 'ACTIVE',
    },
    actionTaken: { type: String, default: 'UNDER_REVIEW' },
  },
  { timestamps: true }
);

export const Report = mongoose.model<IReport>('Report', ReportSchema);
