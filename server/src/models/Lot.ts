import mongoose, { Schema, Document } from 'mongoose';

export interface ILotItem {
  materialCode: string;
  materialNameEn: string;
  materialNameHi?: string;
  quantity?: number;
  weight?: number;
  unit: 'kg' | 'g' | 'piece';
  estimatedRate: number;
  estimatedValue: number;
  classificationSource: 'MANUAL' | 'MOCK_AI' | 'FUTURE_AI';
  classificationConfidence?: number;
}

export interface ILotImage {
  filename: string;
  originalName?: string;
  storageUrl: string;
  mimeType: string;
  sizeBytes: number;
  localBlobKey?: string;
  createdAt: Date;
}

export interface ILot extends Document {
  clientId: string; // Client UUID for idempotency
  humanReadableId: string; // e.g. KC-2026-8F4A92
  collectorId: string;
  collectorName?: string;

  createdAtDevice: Date;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  locationName?: string;

  estimatedValue: number;
  totalWeightKg: number;
  totalItemsCount: number;

  status:
    | 'COLLECTED'
    | 'LOT_CREATED'
    | 'SYNCED'
    | 'OFFER_RECEIVED'
    | 'HANDOVER'
    | 'RECYCLER_ACCEPTED'
    | 'PAYMENT_RECORDED'
    | 'CANCELLED';

  syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

  cancellationReason?: string;
  cancelledAt?: Date;

  offers?: Array<{
    buyerId: string;
    buyerName: string;
    shopName: string;
    offerAmount: number;
    note?: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    createdAt: Date;
  }>;

  buyerId?: string;
  buyerName?: string;
  shopName?: string;
  finalPaidAmount?: number;
  paidAt?: Date;

  qrReference: string; // Secure token or URI
  items: ILotItem[];
  images: ILotImage[];
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const LotItemSchema = new Schema(
  {
    materialCode: { type: String, required: true },
    materialNameEn: { type: String, required: true },
    materialNameHi: { type: String },
    quantity: { type: Number, default: 1 },
    weight: { type: Number, default: 0 },
    unit: { type: String, enum: ['kg', 'g', 'piece'], default: 'kg' },
    estimatedRate: { type: Number, default: 0 },
    estimatedValue: { type: Number, default: 0 },
    classificationSource: {
      type: String,
      enum: ['MANUAL', 'MOCK_AI', 'FUTURE_AI'],
      default: 'MANUAL',
    },
    classificationConfidence: { type: Number },
  },
  { _id: false }
);

const LotImageSchema = new Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String },
    storageUrl: { type: String, required: true },
    mimeType: { type: String, default: 'image/jpeg' },
    sizeBytes: { type: Number, default: 0 },
    localBlobKey: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const LotSchema: Schema = new Schema(
  {
    clientId: { type: String, required: true, unique: true, index: true },
    humanReadableId: { type: String, required: true, unique: true, index: true },
    collectorId: { type: String, required: true, index: true },
    collectorName: { type: String, default: 'Ramesh Kumar' },

    createdAtDevice: { type: Date, default: Date.now },
    latitude: { type: Number },
    longitude: { type: Number },
    locationAccuracy: { type: Number },
    locationName: { type: String, default: 'Approximate Location' },

    estimatedValue: { type: Number, required: true, default: 0 },
    totalWeightKg: { type: Number, required: true, default: 0 },
    totalItemsCount: { type: Number, required: true, default: 1 },

    status: {
      type: String,
      enum: [
        'COLLECTED',
        'LOT_CREATED',
        'SYNCED',
        'OFFER_RECEIVED',
        'HANDOVER',
        'RECYCLER_ACCEPTED',
        'PAYMENT_RECORDED',
        'CANCELLED',
      ],
      default: 'SYNCED',
    },

    cancellationReason: { type: String },
    cancelledAt: { type: Date },

    offers: [
      {
        buyerId: { type: String, required: true },
        buyerName: { type: String, required: true },
        shopName: { type: String, required: true },
        offerAmount: { type: Number, required: true },
        note: { type: String, default: '' },
        status: {
          type: String,
          enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
          default: 'PENDING',
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    buyerId: { type: String },
    buyerName: { type: String },
    shopName: { type: String },
    finalPaidAmount: { type: Number },
    paidAt: { type: Date },

    syncStatus: {
      type: String,
      enum: ['PENDING', 'SYNCING', 'SYNCED', 'FAILED'],
      default: 'SYNCED',
    },

    qrReference: { type: String, required: true },
    items: { type: [LotItemSchema], default: [] },
    images: { type: [LotImageSchema], default: [] },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Lot = mongoose.model<ILot>('Lot', LotSchema);
