import { Router } from 'express';
import prisma from '../config/database';
import { authenticateAdmin } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// GET all update videos (public)
router.get('/', async (req, res) => {
  try {
    const updates = await prisma.updateVideo.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(updates);
  } catch (error) {
    console.error('Fetch updates error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST new update video (admin)
router.post('/', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { title, description, videoUrl } = req.body;
    
    if (!title || !videoUrl) {
      return res.status(400).json({ error: 'Title and Video URL are required' });
    }

    const update = await prisma.updateVideo.create({
      data: {
        title,
        description,
        videoUrl
      }
    });

    res.status(201).json(update);
  } catch (error) {
    console.error('Create update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE update video (admin)
router.delete('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    await prisma.updateVideo.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
