"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const router = (0, express_1.Router)();
// GET /api/health
router.get('/', (_req, res) => {
    const dbState = mongoose_1.default.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
    res.json({
        status: 'ok',
        service: 'Kabadiwala Connect API (SIH26229)',
        version: '1.0.0',
        database: dbStatus,
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
