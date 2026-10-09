import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Lot, ILot } from '../models/Lot.js';
import { Collector } from '../models/Collector.js';
import { Buyer } from '../models/Buyer.js';
import { Price } from '../models/Price.js';
import { SyncEvent } from '../models/SyncEvent.js';

const router = Router();

// Ensure upload directory exists
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `lot-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Helper: generate human-readable ID if not provided
function generateHumanId(): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `KC-2026-${rand}`;
}

// POST /api/lots - Idempotent creation
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const idempotencyKey = (req.headers['idempotency-key'] as string) || req.body.clientId;

    if (!idempotencyKey) {
      res.status(400).json({
        error: { code: 'MISSING_CLIENT_ID', message: 'Client ID / Idempotency-Key is required' },
      });
      return;
    }

    // 1. Check existing record for idempotency
    const existing = await Lot.findOne({ clientId: idempotencyKey });
    if (existing) {
      res.status(200).json({
        success: true,
        idempotent: true,
        lot: existing,
        message: 'Lot already existed (idempotent response)',
      });
      return;
    }

    const {
      humanReadableId,
      collectorId = 'KC-COL-101',
      collectorName = 'Ramesh Kumar',
      createdAtDevice,
      latitude,
      longitude,
      locationAccuracy,
      locationName,
      items = [],
      images = [],
      notes = '',
      status = 'LOT_CREATED',
    } = req.body;

    // Check if collector is banned due to community reports
    const collectorDoc = await Collector.findOne({ collectorId });
    if (collectorDoc?.isBanned) {
      res.status(403).json({
        error: {
          code: 'COLLECTOR_BANNED',
          message: `Account is suspended from creating lots: ${collectorDoc.banReason || 'Multiple community violation reports.'}`,
        },
      });
      return;
    }

    // 2. Validate items
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        error: { code: 'INVALID_ITEMS', message: 'At least one collected item is required' },
      });
      return;
    }

    // 3. Server-authoritative price verification and calculation
    const prices = await Price.find();
    const priceMap = new Map<string, number>();
    prices.forEach((p) => priceMap.set(p.materialCode, p.rate));

    let totalCalculatedValue = 0;
    let totalWeight = 0;

    const validatedItems = items.map((item: any) => {
      const serverRate = priceMap.get(item.materialCode) || item.estimatedRate || 30;
      const weight = Number(item.weight) || 0;
      const quantity = Number(item.quantity) || 1;
      const itemVal = item.unit === 'piece' ? quantity * serverRate : Math.round(weight * serverRate);

      totalCalculatedValue += itemVal;
      totalWeight += weight;

      return {
        materialCode: item.materialCode,
        materialNameEn: item.materialNameEn || item.materialCode,
        materialNameHi: item.materialNameHi,
        quantity,
        weight,
        unit: item.unit || 'kg',
        estimatedRate: serverRate,
        estimatedValue: itemVal,
        classificationSource: item.classificationSource || 'MANUAL',
        classificationConfidence: item.classificationConfidence,
      };
    });

    const lotId = humanReadableId || generateHumanId();
    const qrRef = `KC-LOT-${lotId}-${idempotencyKey.slice(0, 8)}`;

    const newLot = await Lot.create({
      clientId: idempotencyKey,
      humanReadableId: lotId,
      collectorId,
      collectorName,
      createdAtDevice: createdAtDevice ? new Date(createdAtDevice) : new Date(),
      latitude,
      longitude,
      locationAccuracy,
      locationName: locationName || (latitude ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : 'Location unavailable'),
      estimatedValue: totalCalculatedValue,
      totalWeightKg: totalWeight,
      totalItemsCount: validatedItems.length,
      status: status === 'COLLECTED' ? 'LOT_CREATED' : status,
      syncStatus: 'SYNCED',
      qrReference: qrRef,
      items: validatedItems,
      images: images || [],
      notes,
    });

    // Update Collector stats
    await Collector.findOneAndUpdate(
      { collectorId },
      {
        $inc: {
          'stats.totalLots': 1,
          'stats.totalWeightKg': totalWeight,
          'stats.totalEstimatedValue': totalCalculatedValue,
        },
      }
    );

    // Record sync event
    await SyncEvent.create({
      clientId: idempotencyKey,
      lotId: newLot._id.toString(),
      eventType: 'LOT_CREATE',
      status: 'SUCCESS',
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      lot: newLot,
      message: 'Lot synchronized successfully with server',
    });
  } catch (err: any) {
    console.error('Error creating lot:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// GET /api/lots - List lots
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const lots = await Lot.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Lot.countDocuments();

    res.json({
      success: true,
      count: lots.length,
      total,
      data: lots,
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// GET /api/lots/:id - Details
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    let lot = null;

    if (id.startsWith('KC-2026-')) {
      lot = await Lot.findOne({ humanReadableId: id });
    } else {
      lot = await Lot.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { clientId: id }] });
    }

    if (!lot) {
      res.status(404).json({ error: { code: 'LOT_NOT_FOUND', message: 'Lot not found' } });
      return;
    }

    res.json({ success: true, data: lot });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// POST /api/lots/:id/images - Upload photograph
router.post('/:id/images', upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    if (!req.file) {
      res.status(400).json({ error: { code: 'NO_FILE_UPLOADED', message: 'No image file provided' } });
      return;
    }

    const localBlobKey = req.body.localBlobKey || '';
    const storageUrl = `/uploads/${req.file.filename}`;

    const newImage = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      storageUrl,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      localBlobKey,
      createdAt: new Date(),
    };

    const lot = await Lot.findOneAndUpdate(
      { $or: [{ clientId: id }, { humanReadableId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
      { $push: { images: newImage } },
      { new: true }
    );

    if (!lot) {
      res.status(404).json({ error: { code: 'LOT_NOT_FOUND', message: 'Lot not found to attach image' } });
      return;
    }

    await SyncEvent.create({
      clientId: lot.clientId,
      lotId: lot._id.toString(),
      eventType: 'IMAGE_UPLOAD',
      status: 'SUCCESS',
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      image: newImage,
      lotId: lot.humanReadableId,
      message: 'Image uploaded and linked successfully',
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'UPLOAD_FAILED', message: err.message } });
  }
});

// PATCH /api/lots/:id/cancel - Collector cancels their lot
router.patch('/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const { reason = 'Cancelled by collector' } = req.body;

    const lot = await Lot.findOne({
      $or: [
        { clientId: id },
        { humanReadableId: id },
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
      ],
    });

    if (!lot) {
      res.status(404).json({ error: { code: 'LOT_NOT_FOUND', message: 'Lot not found to cancel' } });
      return;
    }

    if (lot.status === 'PAYMENT_RECORDED') {
      res.status(400).json({
        error: {
          code: 'CANNOT_CANCEL_PAID',
          message: 'Cannot cancel lot that has already been purchased and payment settled',
        },
      });
      return;
    }

    const previousStatus = lot.status;
    lot.status = 'CANCELLED';
    lot.cancellationReason = reason;
    lot.cancelledAt = new Date();
    await lot.save();

    // Deduct from collector stats if it was previously counted
    if (previousStatus !== 'CANCELLED') {
      await Collector.findOneAndUpdate(
        { collectorId: lot.collectorId },
        {
          $inc: {
            'stats.totalLots': -1,
            'stats.totalWeightKg': -lot.totalWeightKg,
            'stats.totalEstimatedValue': -lot.estimatedValue,
          },
        }
      );
    }

    await SyncEvent.create({
      clientId: lot.clientId,
      lotId: lot._id.toString(),
      eventType: 'LOT_CANCEL',
      status: 'SUCCESS',
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      lot,
      message: 'Lot cancelled successfully by collector',
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// POST /api/lots/:id/offer - Authenticated buyer submits an offer
router.post('/:id/offer', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const { buyerId, offerAmount, note = '' } = req.body;

    if (!buyerId || !offerAmount) {
      res.status(400).json({ error: { code: 'MISSING_DATA', message: 'buyerId and offerAmount are required' } });
      return;
    }

    const buyer = await Buyer.findOne({ buyerId });
    if (!buyer) {
      res.status(404).json({ error: { code: 'BUYER_NOT_FOUND', message: 'Authenticated buyer profile not found' } });
      return;
    }

    if (buyer.isBanned) {
      res.status(403).json({
        error: {
          code: 'BUYER_BANNED',
          message: `Buyer account suspended: ${buyer.banReason || 'Multiple community violation reports.'}`,
        },
      });
      return;
    }

    const lot = await Lot.findOne({
      $or: [
        { clientId: id },
        { humanReadableId: id },
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
      ],
    });

    if (!lot) {
      res.status(404).json({ error: { code: 'LOT_NOT_FOUND', message: 'Lot not found' } });
      return;
    }

    if (lot.status === 'CANCELLED') {
      res.status(400).json({ error: { code: 'LOT_CANCELLED', message: 'Cannot make an offer on a cancelled lot' } });
      return;
    }

    const newOffer = {
      buyerId: buyer.buyerId,
      buyerName: buyer.ownerName,
      shopName: buyer.shopName,
      offerAmount: Number(offerAmount),
      note,
      status: 'PENDING' as const,
      createdAt: new Date(),
    };

    lot.offers = lot.offers || [];
    lot.offers.push(newOffer);
    if (lot.status === 'LOT_CREATED' || lot.status === 'SYNCED') {
      lot.status = 'OFFER_RECEIVED';
    }

    await lot.save();

    res.json({
      success: true,
      offer: newOffer,
      lot,
      message: 'Offer submitted successfully to collector',
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// POST /api/lots/:id/purchase - Authenticated buyer completes purchase
router.post('/:id/purchase', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const { buyerId, paidAmount } = req.body;

    const buyer = await Buyer.findOne({ buyerId });
    if (!buyer) {
      res.status(404).json({ error: { code: 'BUYER_NOT_FOUND', message: 'Buyer profile not found' } });
      return;
    }

    if (buyer.isBanned) {
      res.status(403).json({
        error: {
          code: 'BUYER_BANNED',
          message: `Buyer account suspended: ${buyer.banReason}`,
        },
      });
      return;
    }

    const lot = await Lot.findOne({
      $or: [
        { clientId: id },
        { humanReadableId: id },
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
      ],
    });

    if (!lot) {
      res.status(404).json({ error: { code: 'LOT_NOT_FOUND', message: 'Lot not found' } });
      return;
    }

    if (lot.status === 'CANCELLED') {
      res.status(400).json({ error: { code: 'LOT_CANCELLED', message: 'Cannot purchase a cancelled lot' } });
      return;
    }

    const finalAmount = Number(paidAmount) || lot.estimatedValue;

    lot.status = 'PAYMENT_RECORDED';
    lot.buyerId = buyer.buyerId;
    lot.buyerName = buyer.ownerName;
    lot.shopName = buyer.shopName;
    lot.finalPaidAmount = finalAmount;
    lot.paidAt = new Date();

    await lot.save();

    await Buyer.findOneAndUpdate(
      { buyerId: buyer.buyerId },
      {
        $inc: {
          'stats.totalLotsPurchased': 1,
          'stats.totalWeightKg': lot.totalWeightKg,
          'stats.totalAmountPaid': finalAmount,
        },
      }
    );

    res.json({
      success: true,
      lot,
      message: 'Lot purchased and payment recorded successfully',
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

export default router;
