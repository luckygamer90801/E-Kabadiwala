import mongoose, { Schema, Document } from 'mongoose';

export interface IMaterial extends Document {
  code: string; // e.g. "mobile_pcb"
  nameEn: string;
  nameHi: string;
  nameMr?: string;
  category: string;
  icon: string; // emoji or icon code
  defaultUnit: 'kg' | 'g' | 'piece';
  indicativeRate: number; // in INR
  descriptionEn: string;
  descriptionHi: string;
  isActive: boolean;
}

const MaterialSchema: Schema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    nameEn: { type: String, required: true },
    nameHi: { type: String, required: true },
    nameMr: { type: String },
    category: { type: String, required: true },
    icon: { type: String, default: '📦' },
    defaultUnit: { type: String, enum: ['kg', 'g', 'piece'], default: 'kg' },
    indicativeRate: { type: Number, required: true },
    descriptionEn: { type: String, default: '' },
    descriptionHi: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Material = mongoose.model<IMaterial>('Material', MaterialSchema);
