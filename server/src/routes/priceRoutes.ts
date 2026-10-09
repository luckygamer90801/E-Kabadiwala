import { Router, Request, Response } from 'express';
import { Price } from '../models/Price.js';

const router = Router();

// GET /api/prices
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const prices = await Price.find().sort({ rate: -1 });
    res.json({
      success: true,
      label: 'Indicative benchmark rates for e-waste materials',
      currency: 'INR',
      count: prices.length,
      data: prices,
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

export default router;
