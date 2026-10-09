import mongoose, { Schema, Document } from 'mongoose';

export interface IRecycler extends Document {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  acceptedMaterials: string[];
  status: 'ACCEPTING' | 'AT_CAPACITY' | 'TEMPORARILY_CLOSED';
  isDemo: boolean;
  contactPhone: string;
  sourceLabel: string;
  operatingHours: string;
}

const RecyclerSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    acceptedMaterials: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['ACCEPTING', 'AT_CAPACITY', 'TEMPORARILY_CLOSED'],
      default: 'ACCEPTING',
    },
    isDemo: { type: Boolean, default: true },
    contactPhone: { type: String, default: '+91 98765 43210' },
    sourceLabel: { type: String, default: 'Demo Authorized Recycler (SIH Prototype)' },
    operatingHours: { type: String, default: '09:00 AM - 06:00 PM' },
  },
  { timestamps: true }
);

export const Recycler = mongoose.model<IRecycler>('Recycler', RecyclerSchema);
