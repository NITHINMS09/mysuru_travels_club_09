import { Router } from 'express';
import prisma from '../config/database';
import { authenticateAdmin } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// GET all settings (public, for the frontend to render dynamically)
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.siteSetting.findMany();
    // Convert array of {key, value} to a flat object { key: value }
    const settingsMap = settings.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=1800');
    res.json(settingsMap);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE or CREATE settings (admin only)
router.post('/', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { settings } = req.body; // Expects { key1: value1, key2: value2 }
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings payload' });
    }

    // Upsert each setting
    for (const [key, value] of Object.entries(settings)) {
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value), category: 'general' }
      });
    }
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
