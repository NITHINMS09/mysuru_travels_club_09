import { Router } from 'express';
import prisma from '../config/database';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

// Get all users and stats
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        bookings: {
          include: {
            trip: {
              select: {
                title: true,
                destination: true,
                startDate: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalUsers = users.length;
    const repeatCustomers = users.filter(u => u.totalTrips > 1).length;
    
    // New customers today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newCustomersToday = users.filter(u => new Date(u.createdAt) >= today).length;

    const totalBookings = users.reduce((acc, user) => acc + user.bookings.length, 0);
    const confirmedBookings = users.reduce((acc, user) => acc + user.bookings.filter(b => b.status === 'CONFIRMED').length, 0);

    res.json({
      users,
      stats: {
        totalUsers,
        totalBookings,
        confirmedBookings,
        repeatCustomers,
        newCustomersToday
      }
    });
  } catch (error) {
    console.error('Failed to get users:', error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

export default router;
