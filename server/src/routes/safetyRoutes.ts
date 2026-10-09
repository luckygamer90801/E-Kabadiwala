import { Router, Request, Response } from 'express';
import { SafetyAlert } from '../models/SafetyAlert.js';

const router = Router();

// GET /api/safety
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const alerts = await SafetyAlert.find().sort({ severity: -1 });
    res.json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

export default router;
