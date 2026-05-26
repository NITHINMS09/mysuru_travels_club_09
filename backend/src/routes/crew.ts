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
    const { name, role, image, contact, instagram, description } = req.body;
    
    if (!name || !role || !image) {
      return res.status(400).json({ error: 'Name, role, and image are required' });
    }

    const newMember = await prisma.crewMember.create({
      data: {
        name,
        role,
        image,
        contact,
        instagram,
        description
      }
    });
    
    res.status(201).json(newMember);
  } catch (error) {
    console.error('Create crew error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE crew member (admin)
router.put('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, role, image, contact, instagram, description } = req.body;

    if (!name || !role || !image || !description) {
      return res.status(400).json({ error: 'Name, role, image, and description are required' });
    }

    const updatedMember = await prisma.crewMember.update({
      where: { id: req.params.id },
      data: {
        name,
        role,
        image,
        contact,
        instagram,
        description
      }
    });

    res.json(updatedMember);
  } catch (error: any) {
    console.error('Update crew error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Crew member not found' });
    }
    res.status(500).json({ error: 'Server error: ' + error.message });
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
