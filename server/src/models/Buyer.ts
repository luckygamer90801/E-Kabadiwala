import mongoose, { Schema, Document } from 'mongoose';

export interface IBuyer extends Document {
  buyerId: string;
  shopName: string;
  ownerName: string;
  phone: string;
  gstin: string;
  licenseType: string;
  isVerified: boolean;
  shopLatitude: number;
  shopLongitude: number;
  shopAddress: string;
  operatingHours: string;
  acceptedMaterials: string[];
  stats: {
    totalLotsPurchased: number;
    totalWeightKg: number;
    totalAmountPaid: number;
  };
  isBanned: boolean;
  banReason?: string;
  banTimestamp?: Date;
  reportCount: number;
  severityScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const BuyerSchema: Schema = new Schema(
  {
    buyerId: { type: String, required: true, unique: true, index: true },
    shopName: { type: String, required: true },
    ownerName: { type: String, required: true },
    phone: { type: String, required: true, unique: true, index: true },
    gstin: { type: String, required: true },
    licenseType: {
      type: String,
      default: 'GSTIN',
      enum: ['GSTIN', 'MSME', 'POLLUTION_CONTROL_BOARD', 'MUNICIPAL_TRADE_LICENSE'],
    },
    isVerified: { type: Boolean, default: true },
    shopLatitude: { type: Number, required: true },
    shopLongitude: { type: Number, required: true },
    shopAddress: { type: String, required: true },
    operatingHours: { type: String, default: '09:00 AM - 07:00 PM' },
    acceptedMaterials: {
      type: [String],
      default: ['mobile_pcb', 'laptop_pcb', 'copper_cable', 'battery_li_ion', 'display_monitor'],
    },
    stats: {
      totalLotsPurchased: { type: Number, default: 0 },
      totalWeightKg: { type: Number, default: 0 },
      totalAmountPaid: { type: Number, default: 0 },
    },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: '' },
    banTimestamp: { type: Date },
    reportCount: { type: Number, default: 0 },
    severityScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Buyer = mongoose.model<IBuyer>('Buyer', BuyerSchema);
