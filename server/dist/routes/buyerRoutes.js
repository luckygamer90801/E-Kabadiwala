"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Buyer_js_1 = require("../models/Buyer.js");
const router = (0, express_1.Router)();
// POST /api/buyers/auth - Authentic Buyer Registration & Login
router.post('/auth', async (req, res) => {
    try {
        const { phone, shopName, ownerName, gstin, licenseType = 'GSTIN', shopLatitude, shopLongitude, shopAddress, operatingHours = '09:00 AM - 07:00 PM', acceptedMaterials = ['mobile_pcb', 'laptop_pcb', 'copper_cable', 'battery_li_ion'], } = req.body;
        if (!phone) {
            res.status(400).json({ error: { code: 'INVALID_PHONE', message: 'Phone number is required' } });
            return;
        }
        let buyer = await Buyer_js_1.Buyer.findOne({ phone: phone.trim() });
        if (buyer) {
            // If already banned
            if (buyer.isBanned) {
                res.status(403).json({
                    error: {
                        code: 'BUYER_BANNED',
                        message: `Buyer account is suspended: ${buyer.banReason || 'Multiple community violation reports.'}`,
                        banReason: buyer.banReason,
                        severityScore: buyer.severityScore,
                        reportCount: buyer.reportCount,
                    },
                });
                return;
            }
            // Update shop details if updated
            if (shopName)
                buyer.shopName = shopName.trim();
            if (ownerName)
                buyer.ownerName = ownerName.trim();
            if (gstin)
                buyer.gstin = gstin.trim();
            if (shopLatitude !== undefined)
                buyer.shopLatitude = Number(shopLatitude);
            if (shopLongitude !== undefined)
                buyer.shopLongitude = Number(shopLongitude);
            if (shopAddress)
                buyer.shopAddress = shopAddress.trim();
            if (operatingHours)
                buyer.operatingHours = operatingHours;
            if (acceptedMaterials)
                buyer.acceptedMaterials = acceptedMaterials;
            await buyer.save();
        }
        else {
            // New authentic buyer registration
            if (!shopName || !ownerName || !gstin || shopLatitude === undefined || shopLongitude === undefined) {
                res.status(400).json({
                    error: {
                        code: 'INCOMPLETE_AUTHENTICATION',
                        message: 'Authentic buyer registration requires shop name, owner name, valid GSTIN/license, and shop map location',
                    },
                });
                return;
            }
            const count = await Buyer_js_1.Buyer.countDocuments();
            const buyerId = `KC-BUY-${500 + count + 1}`;
            buyer = await Buyer_js_1.Buyer.create({
                buyerId,
                shopName: shopName.trim(),
                ownerName: ownerName.trim(),
                phone: phone.trim(),
                gstin: gstin.trim(),
                licenseType,
                isVerified: true,
                shopLatitude: Number(shopLatitude),
                shopLongitude: Number(shopLongitude),
                shopAddress: shopAddress?.trim() || `${Number(shopLatitude).toFixed(4)}, ${Number(shopLongitude).toFixed(4)}`,
                operatingHours,
                acceptedMaterials,
                stats: { totalLotsPurchased: 0, totalWeightKg: 0, totalAmountPaid: 0 },
                isBanned: false,
                reportCount: 0,
                severityScore: 0,
            });
        }
        res.json({
            success: true,
            token: `buyer-jwt-token-${buyer.buyerId}`,
            buyer: {
                id: buyer._id,
                buyerId: buyer.buyerId,
                shopName: buyer.shopName,
                ownerName: buyer.ownerName,
                phone: buyer.phone,
                gstin: buyer.gstin,
                licenseType: buyer.licenseType,
                isVerified: buyer.isVerified,
                shopLatitude: buyer.shopLatitude,
                shopLongitude: buyer.shopLongitude,
                shopAddress: buyer.shopAddress,
                operatingHours: buyer.operatingHours,
                acceptedMaterials: buyer.acceptedMaterials,
                stats: buyer.stats,
                isBanned: buyer.isBanned,
                banReason: buyer.banReason,
                reportCount: buyer.reportCount,
                severityScore: buyer.severityScore,
            },
            message: 'Authenticated successfully as verified scrap buyer',
        });
    }
    catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
// GET /api/buyers/profile
router.get('/profile', async (req, res) => {
    try {
        const { buyerId, phone } = req.query;
        let query = {};
        if (buyerId)
            query.buyerId = buyerId;
        else if (phone)
            query.phone = phone;
        let buyer = await Buyer_js_1.Buyer.findOne(Object.keys(query).length > 0 ? query : {});
        if (!buyer) {
            // Return demo buyer if none found
            buyer = await Buyer_js_1.Buyer.findOne();
        }
        if (!buyer) {
            res.status(404).json({ error: { code: 'BUYER_NOT_FOUND', message: 'Buyer profile not found' } });
            return;
        }
        res.json({
            success: true,
            buyer: {
                id: buyer._id,
                buyerId: buyer.buyerId,
                shopName: buyer.shopName,
                ownerName: buyer.ownerName,
                phone: buyer.phone,
                gstin: buyer.gstin,
                licenseType: buyer.licenseType,
                isVerified: buyer.isVerified,
                shopLatitude: buyer.shopLatitude,
                shopLongitude: buyer.shopLongitude,
                shopAddress: buyer.shopAddress,
                operatingHours: buyer.operatingHours,
                acceptedMaterials: buyer.acceptedMaterials,
                stats: buyer.stats,
                isBanned: buyer.isBanned,
                banReason: buyer.banReason,
                reportCount: buyer.reportCount,
                severityScore: buyer.severityScore,
            },
        });
    }
    catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
// PUT /api/buyers/profile - Update shop location or info
router.put('/profile', async (req, res) => {
    try {
        const { buyerId, shopName, shopAddress, shopLatitude, shopLongitude, operatingHours, acceptedMaterials } = req.body;
        const buyer = await Buyer_js_1.Buyer.findOne(buyerId ? { buyerId } : {});
        if (!buyer) {
            res.status(404).json({ error: { code: 'BUYER_NOT_FOUND', message: 'Buyer not found' } });
            return;
        }
        if (shopName)
            buyer.shopName = shopName;
        if (shopAddress)
            buyer.shopAddress = shopAddress;
        if (shopLatitude !== undefined)
            buyer.shopLatitude = Number(shopLatitude);
        if (shopLongitude !== undefined)
            buyer.shopLongitude = Number(shopLongitude);
        if (operatingHours)
            buyer.operatingHours = operatingHours;
        if (acceptedMaterials)
            buyer.acceptedMaterials = acceptedMaterials;
        await buyer.save();
        res.json({ success: true, buyer, message: 'Shop details and location updated' });
    }
    catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
// GET /api/buyers - List all verified buyers
router.get('/', async (_req, res) => {
    try {
        const buyers = await Buyer_js_1.Buyer.find({ isBanned: false }).sort({ createdAt: -1 });
        res.json({
            success: true,
            count: buyers.length,
            data: buyers,
        });
    }
    catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
exports.default = router;
