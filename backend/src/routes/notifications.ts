import { Router } from 'express';
import prisma from '../config/database';

const router = Router();

// GET notifications for user
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) { res.status(400).json({ error: 'Email required' }); return; }
    
    const notifications = await prisma.notification.findMany({
      where: { email: email as string },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark as read
router.patch('/:id/read', async (req, res) => {
  try {
    await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark all as read
router.patch('/read-all', async (req, res) => {
  try {
    const { email } = req.body;
    await prisma.notification.updateMany({ where: { email, read: false }, data: { read: true } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
