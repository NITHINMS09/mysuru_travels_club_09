import { Router } from 'express';
import prisma from '../config/database';
import { authenticateAdmin } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// GET chat messages for a trip
router.get('/:tripId/messages', async (req, res) => {
  try {
    const { page = '1', limit = '50' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const messages = await prisma.chatMessage.findMany({
      where: { tripId: req.params.tripId },
      orderBy: { createdAt: 'asc' },
      skip,
      take: parseInt(limit as string),
    });
    
    const total = await prisma.chatMessage.count({ where: { tripId: req.params.tripId } });
    const formattedMessages = messages.map(msg => ({
      ...msg,
      pollData: typeof msg.pollData === 'string' ? JSON.parse(msg.pollData) : msg.pollData
    }));

    res.json({
      messages: formattedMessages,
      pagination: { total, page: parseInt(page as string), pages: Math.ceil(total / parseInt(limit as string)) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET pinned messages
router.get('/:tripId/pinned', async (req, res) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { tripId: req.params.tripId, pinned: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE message (admin)
router.delete('/message/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    await prisma.chatMessage.update({
      where: { id: req.params.id },
      data: { deleted: true, content: 'This message was deleted by admin' },
    });
    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
