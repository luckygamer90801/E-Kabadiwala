import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

// GET /api/health
router.get('/', (_req: Request, res: Response): void => {
  const dbState = mongoose.connection.readyState;
  const dbStatus =
    dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';

  res.json({
    status: 'ok',
    service: 'Kabadiwala Connect API (SIH26229)',
    version: '1.0.0',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

export default router;
