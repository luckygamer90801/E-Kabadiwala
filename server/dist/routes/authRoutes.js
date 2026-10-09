"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Collector_js_1 = require("../models/Collector.js");
const router = (0, express_1.Router)();
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { phone, name, otp } = req.body;
        if (!phone) {
            res.status(400).json({ error: { code: 'INVALID_PHONE', message: 'Phone number is required' } });
            return;
        }
        // Demo OTP validation: any 4-digit code (e.g., 1234) or if otp matches demo
        if (otp && otp !== '1234' && otp.length !== 4) {
            res.status(400).json({ error: { code: 'INVALID_OTP', message: 'Invalid demo OTP. Use 1234.' } });
            return;
        }
        let collector = await Collector_js_1.Collector.findOne({ phone: phone.trim() });
        if (!collector) {
            const count = await Collector_js_1.Collector.countDocuments();
            collector = await Collector_js_1.Collector.create({
                collectorId: `KC-COL-${100 + count + 1}`,
                name: name?.trim() || 'Ramesh Kumar',
                phone: phone.trim(),
                preferredLanguage: 'hi',
                stats: { totalLots: 0, totalWeightKg: 0, totalEstimatedValue: 0 },
            });
        }
        else if (name && name.trim()) {
            collector.name = name.trim();
            await collector.save();
        }
        res.json({
            success: true,
            token: `demo-jwt-token-${collector.collectorId}`,
            collector: {
                id: collector._id,
                collectorId: collector.collectorId,
                name: collector.name,
                phone: collector.phone,
                preferredLanguage: collector.preferredLanguage,
                stats: collector.stats,
            },
        });
    }
    catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
// GET /api/collector/profile
router.get('/profile', async (req, res) => {
    try {
        let collector = await Collector_js_1.Collector.findOne();
        if (!collector) {
            collector = await Collector_js_1.Collector.create({
                collectorId: 'KC-COL-101',
                name: 'Ramesh Kumar',
                phone: '9876543210',
                preferredLanguage: 'hi',
            });
        }
        res.json({
            collector: {
                id: collector._id,
                collectorId: collector.collectorId,
                name: collector.name,
                phone: collector.phone,
                preferredLanguage: collector.preferredLanguage,
                stats: collector.stats,
            },
        });
    }
    catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
// PUT /api/collector/profile
router.put('/profile', async (req, res) => {
    try {
        const { name, preferredLanguage } = req.body;
        let collector = await Collector_js_1.Collector.findOne();
        if (collector) {
            if (name)
                collector.name = name;
            if (preferredLanguage)
                collector.preferredLanguage = preferredLanguage;
            await collector.save();
        }
        res.json({ success: true, collector });
    }
    catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
exports.default = router;
