"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Recycler_js_1 = require("../models/Recycler.js");
const router = (0, express_1.Router)();
// Helper: Haversine distance in km
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
}
// GET /api/recyclers/nearby
router.get('/nearby', async (req, res) => {
    try {
        const lat = req.query.lat ? Number(req.query.lat) : undefined;
        const lng = req.query.lng ? Number(req.query.lng) : undefined;
        const recyclers = await Recycler_js_1.Recycler.find();
        const formatted = recyclers.map((rec) => {
            let distanceKm = 4.2; // Sensible default demo distance if geolocation unavailable
            if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
                distanceKm = calculateDistanceKm(lat, lng, rec.latitude, rec.longitude);
            }
            return {
                id: rec._id,
                name: rec.name,
                address: rec.address,
                latitude: rec.latitude,
                longitude: rec.longitude,
                acceptedMaterials: rec.acceptedMaterials,
                status: rec.status,
                isDemo: rec.isDemo,
                contactPhone: rec.contactPhone,
                sourceLabel: rec.sourceLabel,
                operatingHours: rec.operatingHours,
                distanceKm,
            };
        });
        formatted.sort((a, b) => a.distanceKm - b.distanceKm);
        res.json({
            success: true,
            count: formatted.length,
            userLocationProvided: lat !== undefined && lng !== undefined,
            data: formatted,
        });
    }
    catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
// GET /api/recyclers/:id
router.get('/:id', async (req, res) => {
    try {
        const recycler = await Recycler_js_1.Recycler.findById(req.params.id);
        if (!recycler) {
            res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recycler not found' } });
            return;
        }
        res.json({ success: true, data: recycler });
    }
    catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
exports.default = router;
