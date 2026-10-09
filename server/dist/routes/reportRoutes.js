"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Report_js_1 = require("../models/Report.js");
const Collector_js_1 = require("../models/Collector.js");
const Buyer_js_1 = require("../models/Buyer.js");
const router = (0, express_1.Router)();
// Helper: Generate report ID
function generateReportId() {
    const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let rand = '';
    for (let i = 0; i < 6; i++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `REP-2026-${rand}`;
}
// Points per severity
const SEVERITY_POINTS = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    SEVERE: 4,
};
// POST /api/reports - File a report with proofs
router.post('/', async (req, res) => {
    try {
        const { reporterType, reporterId, reporterName = 'Anonymous User', targetType, targetId, targetName = 'Reported User', lotId, category, severity = 'MEDIUM', description, proofImages = [], } = req.body;
        if (!reporterType || !targetType || !targetId || !category || !description) {
            res.status(400).json({
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'reporterType, targetType, targetId, category, and description are required',
                },
            });
            return;
        }
        const points = SEVERITY_POINTS[severity] || 2;
        const reportId = generateReportId();
        const report = await Report_js_1.Report.create({
            reportId,
            reporterType,
            reporterId,
            reporterName,
            targetType,
            targetId,
            targetName,
            lotId,
            category,
            severity,
            severityPoints: points,
            description,
            proofImages: Array.isArray(proofImages) ? proofImages : [],
            status: 'ACTIVE',
            actionTaken: 'COMMUNITY_STRIKE_RECORDED',
        });
        // Update target user and evaluate ban threshold
        let targetBanned = false;
        let targetUpdated = null;
        if (targetType === 'COLLECTOR') {
            const collector = await Collector_js_1.Collector.findOne({
                $or: [{ collectorId: targetId }, { phone: targetId }],
            });
            if (collector) {
                collector.reportCount = (collector.reportCount || 0) + 1;
                collector.severityScore = (collector.severityScore || 0) + points;
                // Auto-ban condition: >= 6 points OR >= 3 reports OR any SEVERE report
                if (collector.severityScore >= 6 ||
                    collector.reportCount >= 3 ||
                    severity === 'SEVERE') {
                    collector.isBanned = true;
                    collector.banReason = `Account suspended due to ${collector.reportCount} community violation report(s) (Severity Score: ${collector.severityScore}). Latest violation: ${category} (${severity}).`;
                    collector.banTimestamp = new Date();
                    targetBanned = true;
                }
                await collector.save();
                targetUpdated = collector;
            }
        }
        else if (targetType === 'BUYER') {
            const buyer = await Buyer_js_1.Buyer.findOne({
                $or: [{ buyerId: targetId }, { phone: targetId }],
            });
            if (buyer) {
                buyer.reportCount = (buyer.reportCount || 0) + 1;
                buyer.severityScore = (buyer.severityScore || 0) + points;
                // Auto-ban condition: >= 6 points OR >= 3 reports OR any SEVERE report
                if (buyer.severityScore >= 6 ||
                    buyer.reportCount >= 3 ||
                    severity === 'SEVERE') {
                    buyer.isBanned = true;
                    buyer.banReason = `Buyer trading privileges suspended due to repeated violation reports (Severity Score: ${buyer.severityScore}). Latest violation: ${category} (${severity}).`;
                    buyer.banTimestamp = new Date();
                    targetBanned = true;
                }
                await buyer.save();
                targetUpdated = buyer;
            }
        }
        res.status(201).json({
            success: true,
            report,
            targetBanned,
            targetSummary: targetUpdated
                ? {
                    isBanned: targetUpdated.isBanned,
                    reportCount: targetUpdated.reportCount,
                    severityScore: targetUpdated.severityScore,
                    banReason: targetUpdated.banReason,
                }
                : null,
            message: targetBanned
                ? 'Report submitted with evidence. Due to the seriousness of accumulated violations, the reported user has been banned.'
                : 'Report filed successfully and recorded in community trust index.',
        });
    }
    catch (err) {
        console.error('Error filing report:', err);
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
// GET /api/reports - List reports
router.get('/', async (req, res) => {
    try {
        const { targetId, reporterId } = req.query;
        const filter = {};
        if (targetId)
            filter.targetId = targetId;
        if (reporterId)
            filter.reporterId = reporterId;
        const reports = await Report_js_1.Report.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, count: reports.length, data: reports });
    }
    catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
// GET /api/reports/status/:userId - Check ban status and strikes
router.get('/status/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const [collector, buyer, reports] = await Promise.all([
            Collector_js_1.Collector.findOne({ $or: [{ collectorId: userId }, { phone: userId }] }),
            Buyer_js_1.Buyer.findOne({ $or: [{ buyerId: userId }, { phone: userId }] }),
            Report_js_1.Report.find({ targetId: userId }).sort({ createdAt: -1 }),
        ]);
        const user = collector || buyer;
        if (!user) {
            res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
            return;
        }
        res.json({
            success: true,
            user: {
                id: user.collectorId || user.buyerId,
                name: user.name || user.shopName,
                type: collector ? 'COLLECTOR' : 'BUYER',
                isBanned: user.isBanned,
                banReason: user.banReason,
                banTimestamp: user.banTimestamp,
                reportCount: user.reportCount || 0,
                severityScore: user.severityScore || 0,
            },
            reportsCount: reports.length,
            reports,
        });
    }
    catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
// POST /api/reports/reset-ban/:userId - Demo reset ban helper
router.post('/reset-ban/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        let collector = await Collector_js_1.Collector.findOne({ $or: [{ collectorId: userId }, { phone: userId }] });
        if (collector) {
            collector.isBanned = false;
            collector.banReason = '';
            collector.reportCount = 0;
            collector.severityScore = 0;
            await collector.save();
            res.json({ success: true, message: 'Collector ban and strikes reset successfully' });
            return;
        }
        let buyer = await Buyer_js_1.Buyer.findOne({ $or: [{ buyerId: userId }, { phone: userId }] });
        if (buyer) {
            buyer.isBanned = false;
            buyer.banReason = '';
            buyer.reportCount = 0;
            buyer.severityScore = 0;
            await buyer.save();
            res.json({ success: true, message: 'Buyer ban and strikes reset successfully' });
            return;
        }
        res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }
    catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
exports.default = router;
