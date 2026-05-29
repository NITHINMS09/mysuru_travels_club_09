import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

import { config } from './config';
import prisma from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { initializeSocket } from './socket/chatHandler';
import { initializeLocationSocket } from './socket/locationHandler';

// Import routes
import authRoutes from './routes/auth';
import tripRoutes from './routes/trips';
import bookingRoutes from './routes/bookings';
import reviewRoutes from './routes/reviews';
import blogRoutes from './routes/blogs';
import voteRoutes from './routes/votes';
import analyticsRoutes from './routes/analytics';
import chatRoutes from './routes/chat';
import aiRoutes from './routes/ai';
import notificationRoutes from './routes/notifications';
import crewRoutes from './routes/crew';
import settingsRoutes from './routes/settings';
import uploadRoutes from './routes/upload';
import marketplaceRoutes from './routes/marketplace';
import updateRoutes from './routes/updates';
import path from 'path';

const app = express();
const httpServer = createServer(app);



// Socket.io
const io = new SocketServer(httpServer, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize Socket handlers
initializeSocket(io);
initializeLocationSocket(io);

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const allowedOrigins = [
  'https://mysuru-travels-club-09.vercel.app',
  'http://localhost:3000',
  config.frontendUrl,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// API Routes
app.use('/api/v1/auth/admin', authRoutes);
app.use('/api/v1/trips', tripRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/blogs', blogRoutes);
app.use('/api/v1/vote', voteRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/crew', crewRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/marketplace', marketplaceRoutes);
app.use('/api/v1/updates', updateRoutes);



// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = config.port;

prisma.$connect()
  .then(() => {
    console.log(`🔌 Successfully connected to PostgreSQL database`);
    httpServer.listen(PORT, () => {
      console.log(`\n🚀 TripNova Backend Server running on port ${PORT}`);
      console.log(`📡 Socket.io ready for connections`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Frontend URL: ${config.frontendUrl}\n`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to connect to PostgreSQL database:', error);
    process.exit(1);
  });

export { app, io };
