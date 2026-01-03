import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './lib/prisma.js'; // Initialize Prisma
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './config/swagger.js';

// Import routes
// (We will fix these files in the next step!)
import authRoutes from './routes/auth.js';
import menuRoutes from './routes/menu.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import userRoutes from './routes/user.js';
import favoritesRoutes from './routes/favorites.js';

import outletsRoutes from './routes/outlets.js';
import notificationsRoutes from './routes/notifications.js';
import offersRoutes from './routes/offers.js';
import analyticsRoutes from './routes/analytics.js';
import teamRoutes from './routes/team.js';
import supportRoutes from './routes/support.js';
import settingsRoutes from './routes/settings.js';
import campusesRoutes from './routes/campuses.js';
import dashboardRoutes from './routes/dashboard.js';
import adminUsersRoutes from './routes/admin-users.js';
import financeRoutes from './routes/finance.js';
import auditRoutes from './routes/audit.js';
import rolesRoutes from './routes/roles.js';
import cmsRoutes from './routes/cms.js';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
// Configure CORS to allow requests from frontend
const corsOriginEnv = process.env.CORS_ORIGIN;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // If CORS_ORIGIN is set to *, allow all origins
      if (corsOriginEnv === '*') {
        return callback(null, true);
      }

      // In development, allow all origins
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      // Check against specific allowed origins
      const allowedOrigins = corsOriginEnv
        ? corsOriginEnv.split(',').map((o) => o.trim())
        : [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://localhost:19006',
          'exp://localhost:19000',
        ];

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`Blocked by CORS: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Files (for uploads)
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', async (req, res) => {
  try {
    // Simple DB check
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Root Route
app.get('/', (req, res) => {
  res.send('Zordr Backend is running! 🚀 <br> Access API at <a href="/api">/api</a>');
});

// API Documentation Route
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to Zordr API (Prisma Edition)',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      menu: '/api/menu',
      orders: '/api/orders',
      user: '/api/user',
      outlets: '/api/outlets',
      notifications: '/api/notifications',
    },
  });
});

// --- MOUNT ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/user', userRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/outlets', outletsRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/campuses', campusesRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/finance', financeRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/admin/audit', auditRoutes);
app.use('/api/admin/roles', rolesRoutes);
app.use('/api/admin/cms', cmsRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Zordr Backend running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});
