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

// GET /auth/admin/google (Initiates Google OAuth flow)
router.get('/google', (req, res) => {
  const clientId = config.google.clientId;
  const callbackUrl = config.google.callbackUrl;
  
  if (!clientId || !callbackUrl) {
    console.error('Google OAuth Client ID or Callback URL is missing');
    return res.status(500).json({ error: 'Google OAuth is not configured on the server.' });
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
    `client_id=${clientId}` + 
    `&redirect_uri=${encodeURIComponent(callbackUrl)}` + 
    `&response_type=code` + 
    `&scope=${encodeURIComponent('openid email profile')}` + 
    `&prompt=select_account`;

  res.redirect(authUrl);
});

// GET /auth/admin/google/callback (Callback for Google OAuth)
router.get('/google/callback', async (req: any, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect(`${config.frontendUrl}/admin/login?error=Authorization+code+is+missing`);
    }

    // 1. Exchange auth code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        redirect_uri: config.google.callbackUrl,
        grant_type: 'authorization_code',
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Failed to exchange code: ${errText}`);
    }

    const tokenData: any = await tokenResponse.json();

    // 2. Fetch user profile info
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to retrieve user info from Google');
    }

    const userData: any = await profileResponse.json();
    const email = userData.email;
    const name = userData.name;
    const googleId = userData.sub;

    if (!email) {
      return res.redirect(`${config.frontendUrl}/admin/login?error=No+email+returned+from+Google`);
    }

    // 3. Find if user is an administrator
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (admin) {
      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: admin.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'] }
      );
      const redirectUrl = `${config.frontendUrl}/admin/login?token=${token}&adminUser=${encodeURIComponent(JSON.stringify({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: admin.avatar || userData.picture
      }))}`;
      return res.redirect(redirectUrl);
    }

    // 4. Find or create a regular customer (User model)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: 'insensitive' } },
          { googleId }
        ]
      }
    });

    if (!user) {
      // Create user with a unique placeholder phone number
      const placeholderPhone = `GOOGLE_${googleId}`;
      user = await prisma.user.create({
        data: {
          fullName: name,
          email,
          googleId,
          mobileNumber: placeholderPhone
        }
      });
    } else if (!user.email || !user.googleId) {
      // Bind email and googleId to existing user record
      user = await prisma.user.update({
        where: { id: user.id },
        data: { email, googleId }
      });
    }

    // Sign User JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email || '', role: 'USER' },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'] }
    );

    const redirectUrl = `${config.frontendUrl}/admin/login?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: user.id,
      name: user.fullName,
      email: user.email,
      mobileNumber: user.mobileNumber
    }))}`;
    return res.redirect(redirectUrl);

  } catch (error: any) {
    console.error('Google OAuth error:', error);
    res.redirect(`${config.frontendUrl}/admin/login?error=${encodeURIComponent(error.message || 'Google OAuth failed')}`);
  }
});

export default router;
