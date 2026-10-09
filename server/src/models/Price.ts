import mongoose, { Schema, Document } from 'mongoose';

export interface IPrice extends Document {
  materialCode: string;
  materialNameEn: string;
  materialNameHi: string;
  rate: number;
  unit: string;
  currency: string;
  sourceLabel: string; // e.g. "Indicative benchmark (SIH Demo)"
  isDemo: boolean;
  effectiveAt: Date;
}

const PriceSchema: Schema = new Schema(
  {
    materialCode: { type: String, required: true, unique: true },
    materialNameEn: { type: String, required: true },
    materialNameHi: { type: String, required: true },
    rate: { type: Number, required: true },
    unit: { type: String, default: 'kg' },
    currency: { type: String, default: 'INR' },
    sourceLabel: { type: String, default: 'Indicative benchmark' },
    isDemo: { type: Boolean, default: true },
    effectiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Price = mongoose.model<IPrice>('Price', PriceSchema);
