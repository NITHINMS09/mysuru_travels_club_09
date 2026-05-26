import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '../.env' });

import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { initializeSocket } from './socket/chatHandler';
import { initializeLocationSocket } from './socket/locationHandler';

// Import routes
import authRoutes from './routes/auth';
import tripRoutes from './routes/trips';
import bookingRoutes from './routes/bookings';
import paymentRoutes from './routes/payments';
import reviewRoutes from './routes/reviews';
import blogRoutes from './routes/blogs';
import voteRoutes from './routes/votes';
import chatRoutes from './routes/chat';
import aiRoutes from './routes/ai';
import notificationRoutes from './routes/notifications';
import crewRoutes from './routes/crew';
import settingsRoutes from './routes/settings';
import uploadRoutes from './routes/upload';
import marketplaceRoutes from './routes/marketplace';
import path from 'path';

const app = express();
const httpServer = createServer(app);

// Create uploads directory if not exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.use('/uploads', express.static('uploads'));

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
app.use(cors({
  origin: config.frontendUrl,
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
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/blogs', blogRoutes);
app.use('/api/v1/vote', voteRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/crew', crewRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/marketplace', marketplaceRoutes);

// Serve static files from public directory
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = config.port;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 TripNova Backend Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Frontend URL: ${config.frontendUrl}\n`);
});

export { app, io };
