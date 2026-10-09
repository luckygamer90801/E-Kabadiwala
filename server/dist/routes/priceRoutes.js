"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Price_js_1 = require("../models/Price.js");
const router = (0, express_1.Router)();
// GET /api/prices
router.get('/', async (_req, res) => {
    try {
        const prices = await Price_js_1.Price.find().sort({ rate: -1 });
        res.json({
            success: true,
            label: 'Indicative benchmark rates for e-waste materials',
            currency: 'INR',
            count: prices.length,
            data: prices,
        });
    }
    catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
exports.default = router;
