"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const db_js_1 = require("./config/db.js");
const seedData_js_1 = require("./seeds/seedData.js");
const authRoutes_js_1 = __importDefault(require("./routes/authRoutes.js"));
const materialRoutes_js_1 = __importDefault(require("./routes/materialRoutes.js"));
const priceRoutes_js_1 = __importDefault(require("./routes/priceRoutes.js"));
const lotRoutes_js_1 = __importDefault(require("./routes/lotRoutes.js"));
const syncRoutes_js_1 = __importDefault(require("./routes/syncRoutes.js"));
const recyclerRoutes_js_1 = __importDefault(require("./routes/recyclerRoutes.js"));
const safetyRoutes_js_1 = __importDefault(require("./routes/safetyRoutes.js"));
const healthRoutes_js_1 = __importDefault(require("./routes/healthRoutes.js"));
const buyerRoutes_js_1 = __importDefault(require("./routes/buyerRoutes.js"));
const reportRoutes_js_1 = __importDefault(require("./routes/reportRoutes.js"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '15mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '15mb' }));
// Static uploads serving
const uploadsDir = path_1.default.resolve('uploads');
app.use('/uploads', express_1.default.static(uploadsDir));
// API Routes
app.use('/api/auth', authRoutes_js_1.default);
app.use('/api/collector', authRoutes_js_1.default);
app.use('/api/materials', materialRoutes_js_1.default);
app.use('/api/prices', priceRoutes_js_1.default);
app.use('/api/lots', lotRoutes_js_1.default);
app.use('/api/sync', syncRoutes_js_1.default);
app.use('/api/recyclers', recyclerRoutes_js_1.default);
app.use('/api/safety', safetyRoutes_js_1.default);
app.use('/api/health', healthRoutes_js_1.default);
app.use('/api/buyers', buyerRoutes_js_1.default);
app.use('/api/reports', reportRoutes_js_1.default);
// Root route
app.get('/', (_req, res) => {
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
app.use((err, _req, res, _next) => {
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
        await (0, db_js_1.connectDB)();
        await (0, seedData_js_1.seedDatabase)();
        app.listen(PORT, () => {
            console.log(`[Server] Kabadiwala Connect API listening on port ${PORT}`);
            console.log(`[Server] Health check available at http://localhost:${PORT}/api/health`);
        });
    }
    catch (error) {
        console.error('[Server] Critical startup error:', error.message);
        process.exit(1);
    }
}
startServer();
