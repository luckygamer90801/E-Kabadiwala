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
exports.Buyer = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const BuyerSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
exports.Buyer = mongoose_1.default.model('Buyer', BuyerSchema);
