import { Router, Request, Response } from 'express';
import { Material } from '../models/Material.js';

const router = Router();

// GET /api/materials
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const materials = await Material.find({ isActive: true }).sort({ category: 1, nameEn: 1 });
    res.json({ success: true, count: materials.length, data: materials });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

export default router;
