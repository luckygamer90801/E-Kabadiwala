"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lot = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const LotItemSchema = new mongoose_1.Schema({
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
}, { _id: false });
const LotImageSchema = new mongoose_1.Schema({
    filename: { type: String, required: true },
    originalName: { type: String },
    storageUrl: { type: String, required: true },
    mimeType: { type: String, default: 'image/jpeg' },
    sizeBytes: { type: Number, default: 0 },
    localBlobKey: { type: String },
    createdAt: { type: Date, default: Date.now },
}, { _id: false });
const LotSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
exports.Lot = mongoose_1.default.model('Lot', LotSchema);
