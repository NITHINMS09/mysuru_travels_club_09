import { Router } from 'express';
import prisma from '../config/database';
import { authenticateAdmin } from '../middleware/auth';
import { getCache, setCache, clearCache } from '../utils/cache';
import { deleteAssetFromUrl } from '../utils/cloudinary';

const router = Router();

// GET all destinations (public, sorted by votes)
router.get('/destinations', async (_req, res) => {
  try {
    const cacheKey = 'votes:destinations';
    const cachedData = getCache<any>(cacheKey);
    if (cachedData) {
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      return res.json(cachedData);
    }

    const destinations = await prisma.voteDestination.findMany({
      orderBy: { voteCount: 'desc' },
      include: {
        _count: { select: { votes: true, comments: true } },
        comments: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    setCache(cacheKey, destinations, 60000); // 1 minute cache

    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json(destinations);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Suggest destination (public)
router.post('/destinations', async (req, res) => {
  try {
    const { name, description, imageUrl, suggestedBy } = req.body;
    const dest = await prisma.voteDestination.create({
      data: { name, description, imageUrl, suggestedBy },
    });
    clearCache('votes:');
    res.status(201).json(dest);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Cast vote (public)
router.post('/:id/vote', async (req, res) => {
  try {
    const { voterEmail } = req.body;
    const existing = await prisma.vote.findUnique({
      where: { destinationId_voterEmail: { destinationId: req.params.id, voterEmail } },
    });
    if (existing) {
      // Remove vote (toggle)
      await prisma.vote.delete({ where: { id: existing.id } });
      await prisma.voteDestination.update({
        where: { id: req.params.id },
        data: { voteCount: { decrement: 1 } },
      });
      clearCache('votes:');
      res.json({ voted: false });
      return;
    }
    await prisma.vote.create({ data: { destinationId: req.params.id, voterEmail } });
    await prisma.voteDestination.update({
      where: { id: req.params.id },
      data: { voteCount: { increment: 1 } },
    });
    clearCache('votes:');
    res.json({ voted: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add comment to destination (public)
router.post('/:id/comments', async (req, res) => {
  try {
    const { userName, userEmail, comment } = req.body;
    const c = await prisma.voteComment.create({
      data: { destinationId: req.params.id, userName, userEmail, comment },
    });
    clearCache('votes:');
    res.status(201).json(c);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update destination (admin only)
router.put('/destinations/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, description, voteCount } = req.body;
    const dest = await prisma.voteDestination.update({
      where: { id: req.params.id },
      data: { name, description, voteCount: voteCount ? parseInt(voteCount) : undefined },
    });
    clearCache('votes:');
    res.json(dest);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete destination (admin only)
router.delete('/destinations/:id', authenticateAdmin, async (req, res) => {
  try {
    const dest = await prisma.voteDestination.findUnique({ where: { id: req.params.id } });
    if (dest && dest.imageUrl) {
      await deleteAssetFromUrl(dest.imageUrl);
    }

    await prisma.voteDestination.delete({
      where: { id: req.params.id },
    });
    clearCache('votes:');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
