import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import prisma from '../config/database';
import { config } from '../config';
import { authenticateAdmin } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'] }
    );

    res.json({
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role, avatar: admin.avatar },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify token
router.get('/verify', authenticateAdmin, (req: AuthRequest, res) => {
  res.json({ admin: req.admin });
});

// Dashboard analytics
router.get('/dashboard', authenticateAdmin, async (_req: AuthRequest, res) => {
  try {
    const [totalTrips, totalBookings, totalRevenue, upcomingTrips, recentBookings] = await Promise.all([
      prisma.trip.count(),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      prisma.trip.count({ where: { status: 'UPCOMING' } }),
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { trip: { select: { title: true } }, payment: true },
      }),
    ]);

    const monthlyRevenue = await prisma.payment.groupBy({
      by: ['createdAt'],
      where: { status: 'PAID' },
      _sum: { amount: true },
    });

    const bookingsByStatus = await prisma.booking.groupBy({
      by: ['status'],
      _count: true,
    });

    res.json({
      stats: {
        totalTrips,
        totalBookings,
        totalRevenue: totalRevenue._sum.amount || 0,
        upcomingTrips,
      },
      recentBookings,
      bookingsByStatus,
      monthlyRevenue,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
