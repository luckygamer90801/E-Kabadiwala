"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SafetyAlert_js_1 = require("../models/SafetyAlert.js");
const router = (0, express_1.Router)();
// GET /api/safety
router.get('/', async (_req, res) => {
    try {
        const alerts = await SafetyAlert_js_1.SafetyAlert.find().sort({ severity: -1 });
        res.json({
            success: true,
            count: alerts.length,
            data: alerts,
        });
    }
    catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
exports.default = router;
