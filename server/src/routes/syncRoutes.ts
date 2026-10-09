import { Router, Request, Response } from 'express';
import { Lot } from '../models/Lot.js';
import { SyncEvent } from '../models/SyncEvent.js';
import { Collector } from '../models/Collector.js';

const router = Router();

// POST /api/sync - Batch synchronization
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { lots = [], collectorId = 'KC-COL-101' } = req.body;

    if (!Array.isArray(lots) || lots.length === 0) {
      res.json({ success: true, processedCount: 0, results: [] });
      return;
    }

    const results = [];

    for (const lotData of lots) {
      const clientId = lotData.clientId;
      if (!clientId) {
        results.push({ clientId: 'unknown', status: 'FAILED', error: 'Missing clientId' });
        continue;
      }

      try {
        const existing = await Lot.findOne({ clientId });
        if (existing) {
          results.push({
            clientId,
            serverId: existing._id,
            humanReadableId: existing.humanReadableId,
            status: 'ALREADY_SYNCED',
            message: 'Record previously synchronized',
          });
          continue;
        }

        const newLot = await Lot.create({
          clientId,
          humanReadableId: lotData.humanReadableId || `KC-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          collectorId: lotData.collectorId || collectorId,
          collectorName: lotData.collectorName || 'Ramesh Kumar',
          createdAtDevice: lotData.createdAtDevice ? new Date(lotData.createdAtDevice) : new Date(),
          latitude: lotData.latitude,
          longitude: lotData.longitude,
          locationAccuracy: lotData.locationAccuracy,
          locationName: lotData.locationName || (lotData.latitude ? `${lotData.latitude.toFixed(4)}, ${lotData.longitude.toFixed(4)}` : 'Location unavailable'),
          estimatedValue: Number(lotData.estimatedValue) || 0,
          totalWeightKg: Number(lotData.totalWeightKg) || 0,
          totalItemsCount: Array.isArray(lotData.items) ? lotData.items.length : 1,
          status: 'LOT_CREATED',
          syncStatus: 'SYNCED',
          qrReference: lotData.qrReference || `KC-LOT-${lotData.humanReadableId}-${clientId.slice(0, 8)}`,
          items: lotData.items || [],
          images: lotData.images || [],
          notes: lotData.notes || '',
        });

        await Collector.findOneAndUpdate(
          { collectorId },
          {
            $inc: {
              'stats.totalLots': 1,
              'stats.totalWeightKg': Number(lotData.totalWeightKg) || 0,
              'stats.totalEstimatedValue': Number(lotData.estimatedValue) || 0,
            },
          }
        );

        await SyncEvent.create({
          clientId,
          lotId: newLot._id.toString(),
          eventType: 'BATCH_SYNC',
          status: 'SUCCESS',
          ipAddress: req.ip,
        });

        results.push({
          clientId,
          serverId: newLot._id,
          humanReadableId: newLot.humanReadableId,
          status: 'SYNCED',
          createdAt: newLot.createdAt,
        });
      } catch (lotErr: any) {
        await SyncEvent.create({
          clientId,
          eventType: 'BATCH_SYNC',
          status: 'FAILED',
          errorMessage: lotErr.message,
          ipAddress: req.ip,
        });

        results.push({
          clientId,
          status: 'FAILED',
          error: lotErr.message,
        });
      }
    }

    res.json({
      success: true,
      processedCount: results.length,
      syncedCount: results.filter((r) => r.status === 'SYNCED' || r.status === 'ALREADY_SYNCED').length,
      results,
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SYNC_ERROR', message: err.message } });
  }
});

export default router;
