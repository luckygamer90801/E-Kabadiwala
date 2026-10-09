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
exports.SafetyAlert = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SafetyAlertSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
exports.SafetyAlert = mongoose_1.default.model('SafetyAlert', SafetyAlertSchema);
