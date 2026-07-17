import { Router } from 'express';
import prisma from '../config/database';
import { authenticateAdmin } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// GET reviews for a trip (public)
router.get('/trip/:tripId', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { tripId: req.params.tripId, approved: true },
      orderBy: { createdAt: 'desc' },
    });
    const avg = await prisma.review.aggregate({
      where: { tripId: req.params.tripId, approved: true },
      _avg: { rating: true },
      _count: true,
    });
    res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=600');
    res.json({ reviews, average: avg._avg.rating || 0, count: avg._count });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST review (public)
router.post('/', async (req, res) => {
  try {
    const { tripId, userName, userEmail, rating, comment } = req.body;
    const review = await prisma.review.create({
      data: { tripId, userName, userEmail, rating: parseInt(rating), comment },
    });
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE review (admin)
router.delete('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    await prisma.review.delete({ where: { id: req.params.id } });
    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
