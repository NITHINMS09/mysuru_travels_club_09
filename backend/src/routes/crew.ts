import { Router } from 'express';
import prisma from '../config/database';
import { authenticateAdmin } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { getCache, setCache, clearCache } from '../utils/cache';
import { deleteAssetFromUrl } from '../utils/cloudinary';

const router = Router();

// GET all crew members (public)
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'crew:list';
    const cachedData = getCache<any>(cacheKey);
    if (cachedData) {
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=1800');
      return res.json(cachedData);
    }

    const crew = await prisma.crewMember.findMany({
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    setCache(cacheKey, crew, 300000); // 5 minutes cache

    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=1800');
    res.json(crew);
  } catch (error) {
    console.error('Get crew error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// CREATE crew member (admin)
router.post('/', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, role, image, contact, instagram, description, displayOrder } = req.body;
    
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
        description,
        displayOrder: displayOrder ? parseInt(displayOrder) : 0
      }
    });
    
    clearCache('crew:');
    res.status(201).json(newMember);
  } catch (error) {
    console.error('Create crew error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE crew member (admin)
router.put('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, role, image, contact, instagram, description, displayOrder } = req.body;

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
        description,
        displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : undefined
      }
    });

    clearCache('crew:');
    res.json(updatedMember);
  } catch (error: any) {
    console.error('Update crew error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Crew member not found' });
    }
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// BULK REORDER crew members (admin)
router.patch('/reorder', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { orders } = req.body; // Array of { id, displayOrder }
    
    if (!Array.isArray(orders)) {
      return res.status(400).json({ error: 'Orders must be an array' });
    }

    // Process all updates in a transaction
    await prisma.$transaction(
      orders.map((item: any) => 
        prisma.crewMember.update({
          where: { id: item.id },
          data: { displayOrder: parseInt(item.displayOrder) || 0 }
        })
      )
    );

    clearCache('crew:');
    res.json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error('Reorder crew error:', error);
    res.status(500).json({ error: 'Server error updating order' });
  }
});

// DELETE crew member (admin)
router.delete('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const crew = await prisma.crewMember.findUnique({ where: { id: req.params.id } });
    if (crew && crew.image) {
      await deleteAssetFromUrl(crew.image);
    }

    await prisma.crewMember.delete({
      where: { id: req.params.id }
    });
    clearCache('crew:');
    res.json({ message: 'Crew member deleted' });
  } catch (error) {
    console.error('Delete crew error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
