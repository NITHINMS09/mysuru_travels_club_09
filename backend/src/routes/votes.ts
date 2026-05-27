import { Router } from 'express';
import prisma from '../config/database';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

// GET all destinations (public, sorted by votes)
router.get('/destinations', async (_req, res) => {
  try {
    const destinations = await prisma.voteDestination.findMany({
      orderBy: { voteCount: 'desc' },
      include: {
        _count: { select: { votes: true, comments: true } },
        comments: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
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
      res.json({ voted: false });
      return;
    }
    await prisma.vote.create({ data: { destinationId: req.params.id, voterEmail } });
    await prisma.voteDestination.update({
      where: { id: req.params.id },
      data: { voteCount: { increment: 1 } },
    });
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
    res.json(dest);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete destination (admin only)
router.delete('/destinations/:id', authenticateAdmin, async (req, res) => {
  try {
    await prisma.voteDestination.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
