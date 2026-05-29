import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get WhatsApp Settings
router.get('/', async (req, res) => {
  try {
    let settings = await prisma.whatsAppSettings.findFirst();
    if (!settings) {
      settings = await prisma.whatsAppSettings.create({
        data: {
          messageTemplate: `Hello {CustomerName},

Your payment for {TripName} has been successfully verified.

Thank you for booking with Mysuru Travel Club.

Please reply with your pickup location.

Contact:
9632463347`,
          imageUrl: null,
        }
      });
    }
    res.json(settings);
  } catch (error) {
    console.error('Failed to get WhatsApp settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update WhatsApp Settings
router.post('/', async (req, res) => {
  try {
    const { messageTemplate, imageUrl } = req.body;
    let settings = await prisma.whatsAppSettings.findFirst();
    if (settings) {
      settings = await prisma.whatsAppSettings.update({
        where: { id: settings.id },
        data: { messageTemplate, imageUrl }
      });
    } else {
      settings = await prisma.whatsAppSettings.create({
        data: { messageTemplate, imageUrl }
      });
    }
    res.json(settings);
  } catch (error) {
    console.error('Failed to update WhatsApp settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
