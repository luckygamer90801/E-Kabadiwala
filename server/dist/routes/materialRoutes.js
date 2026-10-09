"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Material_js_1 = require("../models/Material.js");
const router = (0, express_1.Router)();
// GET /api/materials
router.get('/', async (_req, res) => {
    try {
        const materials = await Material_js_1.Material.find({ isActive: true }).sort({ category: 1, nameEn: 1 });
        res.json({ success: true, count: materials.length, data: materials });
    }
    catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
exports.default = router;
