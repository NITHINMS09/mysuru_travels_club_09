import { Router } from 'express';
import prisma from '../config/database';
import { authenticateAdmin } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { getCache, setCache, clearCache } from '../utils/cache';

const router = Router();

// GET all update videos (public - published only)
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'updates:list';
    const cachedData = getCache<any>(cacheKey);
    if (cachedData) {
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=1800');
      return res.json(cachedData);
    }

    const updates = await prisma.updateVideo.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' }
    });

    setCache(cacheKey, updates, 300000); // 5 minutes cache

    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=1800');
    res.json(updates);
  } catch (error) {
    console.error('Fetch updates error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET all update videos (admin - includes drafts)
router.get('/admin', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const updates = await prisma.updateVideo.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(updates);
  } catch (error) {
    console.error('Fetch admin updates error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET stats (admin)
router.get('/stats', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const [total, published, drafts, viewsAgg] = await Promise.all([
      prisma.updateVideo.count(),
      prisma.updateVideo.count({ where: { status: 'PUBLISHED' } }),
      prisma.updateVideo.count({ where: { status: 'DRAFT' } }),
      prisma.updateVideo.aggregate({ _sum: { views: true } })
    ]);
    res.json({
      total,
      published,
      drafts,
      totalViews: viewsAgg._sum.views || 0
    });
  } catch (error) {
    console.error('Fetch updates stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST new update video (admin)
router.post('/', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { title, description, videoUrl, thumbnailUrl, fileSize, duration, status, category } = req.body;
    
    if (!title || !videoUrl) {
      return res.status(400).json({ error: 'Title and Video URL are required' });
    }

    const update = await prisma.updateVideo.create({
      data: {
        title,
        description,
        videoUrl,
        thumbnailUrl,
        fileSize,
        duration,
        status: status || 'PUBLISHED',
        category
      }
    });

    clearCache('updates:');
    res.status(201).json(update);
  } catch (error) {
    console.error('Create update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT edit update video (admin)
router.put('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { title, description, videoUrl, thumbnailUrl, fileSize, duration, status, category } = req.body;
    
    const update = await prisma.updateVideo.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        videoUrl,
        thumbnailUrl,
        fileSize,
        duration,
        status,
        category
      }
    });

    clearCache('updates:');
    res.json(update);
  } catch (error) {
    console.error('Edit update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE update video (admin)
router.delete('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    await prisma.updateVideo.delete({
      where: { id: req.params.id }
    });
    clearCache('updates:');
    res.json({ success: true });
  } catch (error) {
    console.error('Delete update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST increment view count (public)
router.post('/:id/view', async (req, res) => {
  try {
    await prisma.updateVideo.update({
      where: { id: req.params.id },
      data: { views: { increment: 1 } }
    });
    res.json({ success: true });
  } catch (error) {
    // Silently fail for views to not interrupt user
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
