import { Router } from 'express';
import prisma from '../config/database';
import { authenticateAdmin } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// Extract YouTube Shorts ID
function getYouTubeShortsId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Extract Instagram Reel Shortcode
function getInstagramReelShortcode(url: string): string | null {
  const match = url.match(/(?:instagram\.com\/p\/|instagram\.com\/reel\/|instagram\.com\/tv\/)([a-zA-Z0-9__-]+)/);
  return match ? match[1] : null;
}

// GET all updates (public)
router.get('/', async (req, res) => {
  const { category, type, search, page = '1', limit = '12' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  try {
    const where: any = {};

    if (category && category !== 'all') {
      where.category = category as string;
    }

    if (type && type !== 'all') {
      where.type = type as string;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [updates, total] = await Promise.all([
      prisma.socialUpdate.findMany({
        where,
        orderBy: [
          { isFeatured: 'desc' },
          { orderIndex: 'asc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.socialUpdate.count({ where })
    ]);

    res.json({
      updates,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Fetch social updates error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single update (public)
router.get('/:id', async (req, res) => {
  try {
    const update = await prisma.socialUpdate.findUnique({
      where: { id: req.params.id }
    });
    if (!update) {
      return res.status(404).json({ error: 'Update not found' });
    }
    res.json(update);
  } catch (error) {
    console.error('Fetch single update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create update (admin only)
router.post('/', authenticateAdmin, async (req: AuthRequest, res) => {
  const { url, title, description, category, thumbnailUrl, isFeatured, orderIndex } = req.body;

  if (!title || !category) {
    return res.status(400).json({ error: 'Title and Category are required' });
  }

  try {
    let finalType = 'ANNOUNCEMENT';
    let finalThumbnail = thumbnailUrl || null;

    if (url) {
      const ytId = getYouTubeShortsId(url);
      const instaShortcode = getInstagramReelShortcode(url);

      if (ytId) {
        finalType = 'VIDEO';
        if (!finalThumbnail) {
          finalThumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        }
      } else if (instaShortcode) {
        finalType = 'REEL';
        if (!finalThumbnail) {
          finalThumbnail = `https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=600&auto=format&fit=crop`; // default Instagram placeholder
        }
      } else if (category === 'reviews') {
        finalType = 'REVIEW';
      }
    } else {
      if (category === 'reviews') finalType = 'REVIEW';
      else if (category === 'trips') finalType = 'TRIP';
    }

    const newUpdate = await prisma.socialUpdate.create({
      data: {
        url: url || '',
        type: finalType,
        title,
        description: description || '',
        category,
        thumbnailUrl: finalThumbnail,
        isFeatured: isFeatured === true,
        orderIndex: orderIndex ? parseInt(orderIndex.toString(), 10) : 0
      }
    });

    res.status(201).json(newUpdate);
  } catch (error) {
    console.error('Create social update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update details (admin only)
router.put('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  const { url, title, description, category, thumbnailUrl, isFeatured, orderIndex } = req.body;

  try {
    const existing = await prisma.socialUpdate.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Update not found' });
    }

    let finalType = existing.type;
    let finalThumbnail = thumbnailUrl !== undefined ? thumbnailUrl : existing.thumbnailUrl;

    if (url !== undefined && url !== existing.url) {
      const ytId = getYouTubeShortsId(url);
      const instaShortcode = getInstagramReelShortcode(url);

      if (ytId) {
        finalType = 'VIDEO';
        if (!finalThumbnail || finalThumbnail === existing.thumbnailUrl) {
          finalThumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        }
      } else if (instaShortcode) {
        finalType = 'REEL';
      } else {
        finalType = category ? (category === 'reviews' ? 'REVIEW' : 'ANNOUNCEMENT') : existing.type;
      }
    }

    const updated = await prisma.socialUpdate.update({
      where: { id: req.params.id },
      data: {
        url: url !== undefined ? url : existing.url,
        type: finalType,
        title: title !== undefined ? title : existing.title,
        description: description !== undefined ? description : existing.description,
        category: category !== undefined ? category : existing.category,
        thumbnailUrl: finalThumbnail,
        isFeatured: isFeatured !== undefined ? isFeatured === true : existing.isFeatured,
        orderIndex: orderIndex !== undefined ? parseInt(orderIndex.toString(), 10) : existing.orderIndex
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update social update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE update (admin only)
router.delete('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    await prisma.socialUpdate.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, message: 'Update deleted successfully' });
  } catch (error) {
    console.error('Delete social update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST reorder updates (admin only)
router.post('/reorder', authenticateAdmin, async (req: AuthRequest, res) => {
  const { orders } = req.body; // Expects array of { id, orderIndex }

  if (!Array.isArray(orders)) {
    return res.status(400).json({ error: 'Invalid orders payload' });
  }

  try {
    await prisma.$transaction(
      orders.map((item) =>
        prisma.socialUpdate.update({
          where: { id: item.id },
          data: { orderIndex: parseInt(item.orderIndex.toString(), 10) }
        })
      )
    );

    res.json({ success: true, message: 'Reordered successfully' });
  } catch (error) {
    console.error('Reorder updates error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
