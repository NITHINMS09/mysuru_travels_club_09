import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import prisma from '../config/database';
import { config } from '../config';
import { authenticateAdmin, requireSuperAdmin } from '../middleware/auth';
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
    const [totalTrips, totalBookings, totalRevenue, upcomingTrips, recentBookings, totalBlogs, totalVideos, pendingPayments, confirmedPayments, rejectedPayments, notificationsSent] = await Promise.all([
      prisma.trip.count(),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      prisma.trip.count({ where: { status: 'UPCOMING' } }),
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { trip: { select: { title: true } }, payment: true },
      }),
      prisma.blog.count(),
      prisma.updateVideo.count(),
      prisma.booking.count({ where: { status: { in: ['PENDING', 'PENDING_VERIFICATION'] } } }),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { status: 'REJECTED' } }),
      prisma.notificationLog.count({ where: { status: 'SENT' } })
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
        totalBlogs,
        totalVideos,
        pendingPayments,
        confirmedPayments,
        rejectedPayments,
        notificationsSent,
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

// GET all users (travelers)
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      select: {
        email: true,
        travelerName: true,
        phone: true,
        age: true,
        gender: true,
        emergencyName: true,
        emergencyPhone: true,
        totalAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    const usersMap: any = {};
    bookings.forEach(b => {
      if (!b.email) return;
      const emailLower = b.email.toLowerCase().trim();
      if (!usersMap[emailLower]) {
        usersMap[emailLower] = {
          email: b.email,
          name: b.travelerName,
          phone: b.phone,
          age: b.age,
          gender: b.gender,
          emergencyName: b.emergencyName,
          emergencyPhone: b.emergencyPhone,
          bookingsCount: 0,
          totalSpent: 0,
          lastBookingDate: b.createdAt,
          status: 'Active'
        };
      }
      usersMap[emailLower].bookingsCount += 1;
      usersMap[emailLower].totalSpent += b.totalAmount;
      if (new Date(b.createdAt) > new Date(usersMap[emailLower].lastBookingDate)) {
        usersMap[emailLower].lastBookingDate = b.createdAt;
      }
    });

    // Check banned users
    const bannedSetting = await prisma.siteSetting.findUnique({ where: { key: 'banned_emails' } });
    if (bannedSetting) {
      const bannedEmails = JSON.parse(bannedSetting.value);
      if (Array.isArray(bannedEmails)) {
        bannedEmails.forEach((email: string) => {
          const emailLower = email.toLowerCase().trim();
          if (usersMap[emailLower]) {
            usersMap[emailLower].status = 'Banned';
          } else {
            // Add banned user shell if they have no bookings yet
            usersMap[emailLower] = {
              email,
              name: 'Suspended Explorer',
              phone: 'N/A',
              age: 0,
              gender: 'N/A',
              emergencyName: 'N/A',
              emergencyPhone: 'N/A',
              bookingsCount: 0,
              totalSpent: 0,
              lastBookingDate: new Date(),
              status: 'Banned'
            };
          }
        });
      }
    }

    const users = Object.values(usersMap);
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE user details (across all their bookings)
router.put('/users/:email', authenticateAdmin, async (req, res) => {
  try {
    const { email } = req.params;
    const { name, phone, age, gender, emergencyName, emergencyPhone } = req.body;

    await prisma.booking.updateMany({
      where: { email: { equals: email } },
      data: {
        travelerName: name,
        phone,
        age: age ? parseInt(age) : undefined,
        gender,
        emergencyName,
        emergencyPhone
      }
    });

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE user (and all bookings)
router.delete('/users/:email', authenticateAdmin, async (req, res) => {
  try {
    const { email } = req.params;
    await prisma.booking.deleteMany({
      where: { email: { equals: email } }
    });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET all administrators (Super admin only)
router.get('/admins', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true
      }
    });
    res.json({ admins });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// CREATE administrator (Super admin only)
router.post('/admins', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, password, role = 'MODERATOR' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Admin email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newAdmin = await prisma.admin.create({
      data: {
        name,
        email,
        passwordHash,
        role
      }
    });

    res.status(201).json({
      admin: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE administrator (Super admin only)
router.put('/admins/:id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, password } = req.body;
    
    const updateData: any = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.admin.update({
      where: { id },
      data: updateData
    });

    res.json({
      admin: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role
      }
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE administrator (Super admin only)
router.delete('/admins/:id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent self-deletion
    if (id === (req as any).admin?.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    await prisma.admin.delete({ where: { id } });
    res.json({ message: 'Administrator account removed successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
