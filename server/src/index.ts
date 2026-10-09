import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db.js';
import { seedDatabase } from './seeds/seedData.js';

import authRoutes from './routes/authRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import priceRoutes from './routes/priceRoutes.js';
import lotRoutes from './routes/lotRoutes.js';
import syncRoutes from './routes/syncRoutes.js';
import recyclerRoutes from './routes/recyclerRoutes.js';
import safetyRoutes from './routes/safetyRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import buyerRoutes from './routes/buyerRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static uploads serving
const uploadsDir = path.resolve('uploads');
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/collector', authRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/lots', lotRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/recyclers', recyclerRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/buyers', buyerRoutes);
app.use('/api/reports', reportRoutes);

// Root route
app.get('/', (req: Request, res: Response) => {
  // If visited via a browser, redirect to the frontend application
  if (req.accepts('html')) {
    return res.redirect('http://localhost:3000');
  }
  res.json({
    message: 'Kabadiwala Connect Backend API - SIH26229',
    status: 'ACTIVE',
    endpoints: [
      '/api/health',
      '/api/collector/profile',
      '/api/materials',
      '/api/prices',
      '/api/lots',
      '/api/sync',
      '/api/recyclers/nearby',
      '/api/safety',
    ],
  });
});

// Centralized error handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Error]:', err);
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected server error occurred',
    },
  });
});

// Start Server
async function startServer() {
  try {
    await connectDB();
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`[Server] Kabadiwala Connect API listening on port ${PORT}`);
      console.log(`[Server] Health check available at http://localhost:${PORT}/api/health`);
    });
  } catch (error: any) {
    console.error('[Server] Critical startup error:', error.message);
    process.exit(1);
  }
}

startServer();
