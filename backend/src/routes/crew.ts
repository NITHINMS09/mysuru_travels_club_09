import { Router } from 'express';
import prisma from '../config/database';
import { authenticateAdmin } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// GET all crew members (public)
router.get('/', async (req, res) => {
  try {
    const crew = await prisma.crewMember.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(crew);
  } catch (error) {
    console.error('Get crew error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// CREATE crew member (admin)
router.post('/', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, role, image, contact, instagram } = req.body;
    
    if (!name || !role || !image) {
      return res.status(400).json({ error: 'Name, role, and image are required' });
    }

    const newMember = await prisma.crewMember.create({
      data: {
        name,
        role,
        image,
        contact,
        instagram
      }
    });
    
    res.status(201).json(newMember);
  } catch (error) {
    console.error('Create crew error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE crew member (admin)
router.delete('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    await prisma.crewMember.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Crew member deleted' });
  } catch (error) {
    console.error('Delete crew error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
