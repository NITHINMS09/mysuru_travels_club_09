import { Router } from 'express';
import prisma from '../config/database';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

// Track a visitor page view
router.post('/visit', async (req, res) => {
  try {
    const { sessionId, device, browser, os, referrer, page } = req.body;
    let { visitorId } = req.body;

    if (!sessionId || !page) {
      res.status(400).json({ error: 'Missing required tracking data' });
      return;
    }

    if (!visitorId) visitorId = sessionId;

    let ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') as string;
    ipAddress = ipAddress.split(',')[0].trim();
    if (ipAddress === '::1') ipAddress = '127.0.0.1';

    let country = null;
    let state = null;
    let city = null;

    // Async geolocation lookup if IP is public
    if (ipAddress && ipAddress !== '127.0.0.1') {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ipAddress}`);
        const geoData: any = await geoRes.json();
        if (geoData.status === 'success') {
          country = geoData.country;
          state = geoData.regionName;
          city = geoData.city;
        }
      } catch (err) {
        console.error('Geo IP lookup failed', err);
      }
    }

    await prisma.visitor.upsert({
      where: { visitorId },
      update: {},
      create: { visitorId }
    });

    const session = await prisma.visitorSession.upsert({
      where: { sessionId },
      update: {
        endedAt: new Date()
      },
      create: {
        sessionId,
        visitorId,
        ipAddress,
        country,
        state,
        city,
        device,
        browser,
        os,
        referrer
      }
    });

    await prisma.pageView.create({
      data: {
        sessionId,
        page
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Visitor tracking error:', error);
    res.status(500).json({ error: 'Failed to record visit' });
  }
});

router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const [totalVisitors, activeVisitors, totalBookings] = await Promise.all([
      prisma.visitor.count(),
      prisma.visitorSession.count({
        where: {
          startedAt: {
            gte: new Date(Date.now() - 30 * 60 * 1000)
          }
        }
      }),
      prisma.booking.count()
    ]);

    const conversionRate = totalVisitors > 0 ? ((totalBookings / totalVisitors) * 100).toFixed(2) : '0.00';

    const pageStatsRaw = await prisma.pageView.groupBy({
      by: ['page'],
      _count: { page: true },
      orderBy: { _count: { page: 'desc' } },
      take: 10
    });

    const recentVisitors = await prisma.visitorSession.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
      include: {
        pageViews: {
          orderBy: { visitedAt: 'desc' },
          take: 1
        }
      }
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSessions = await prisma.visitorSession.findMany({
      where: { startedAt: { gte: sevenDaysAgo } },
      select: { startedAt: true }
    });
    const dailyMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailyMap[d.toISOString().split('T')[0]] = 0;
    }
    recentSessions.forEach(s => {
      const dateStr = s.startedAt.toISOString().split('T')[0];
      if (dailyMap[dateStr] !== undefined) dailyMap[dateStr]++;
    });
    const dailyVisitors = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

    res.json({
      totalVisitors,
      activeVisitors,
      totalBookings,
      conversionRate,
      pageStats: pageStatsRaw,
      recentVisitors,
      dailyVisitors
    });
  } catch (error) {
    console.error('Fetch analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
