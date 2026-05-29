import { Router } from 'express';
import prisma from '../config/database';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

// Track a visitor page view
router.post('/visit', async (req, res) => {
  try {
    const { sessionId, device, browser, page } = req.body;
    
    // Very basic IP grab
    const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') as string;

    if (!sessionId || !page) {
      res.status(400).json({ error: 'Missing required tracking data' });
      return;
    }

    await prisma.visitorLog.create({
      data: {
        sessionId,
        ipAddress: ipAddress.split(',')[0].trim(),
        device,
        browser,
        page
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Visitor tracking error:', error);
    res.status(500).json({ error: 'Failed to record visit' });
  }
});

// Get analytics stats for admin dashboard
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const [totalVisits, uniqueVisitors] = await Promise.all([
      prisma.visitorLog.count(),
      prisma.visitorLog.groupBy({
        by: ['sessionId'],
      }).then(res => res.length)
    ]);

    // Group by device
    const deviceStats = await prisma.visitorLog.groupBy({
      by: ['device'],
      _count: { device: true }
    });

    // Group by browser
    const browserStats = await prisma.visitorLog.groupBy({
      by: ['browser'],
      _count: { browser: true }
    });

    // Top pages
    const pageStatsRaw = await prisma.visitorLog.groupBy({
      by: ['page'],
      _count: { page: true },
      orderBy: { _count: { page: 'desc' } },
      take: 5
    });

    res.json({
      totalVisits,
      uniqueVisitors,
      deviceStats,
      browserStats,
      pageStats: pageStatsRaw
    });
  } catch (error) {
    console.error('Fetch analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
