import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const defaultTemplate = `Hello {CustomerName},

Your payment for {TripName} has been successfully verified.

Thank you for booking with Mysuru Travel Club.

Please reply with your pickup location from the available pickup points.

For assistance contact:
9632463347`;

// Get WhatsApp Settings
router.get('/', async (req, res) => {
  try {
    let settings = await prisma.whatsAppSettings.findFirst();
    if (!settings) {
      settings = await prisma.whatsAppSettings.create({
        data: {
          messageTitle: 'Booking Confirmation',
          messageTemplate: defaultTemplate,
          imageUrl: null,
          isActive: true
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
    const { messageTitle, messageTemplate, imageUrl, isActive } = req.body;
    let settings = await prisma.whatsAppSettings.findFirst();
    if (settings) {
      settings = await prisma.whatsAppSettings.update({
        where: { id: settings.id },
        data: { messageTitle, messageTemplate, imageUrl, isActive }
      });
    } else {
      settings = await prisma.whatsAppSettings.create({
        data: { messageTitle, messageTemplate, imageUrl, isActive }
      });
    }
    res.json(settings);
  } catch (error) {
    console.error('Failed to update WhatsApp settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Reset WhatsApp Settings Template
router.post('/reset', async (req, res) => {
  try {
    let settings = await prisma.whatsAppSettings.findFirst();
    if (settings) {
      settings = await prisma.whatsAppSettings.update({
        where: { id: settings.id },
        data: { messageTemplate: defaultTemplate, messageTitle: 'Booking Confirmation' }
      });
    } else {
      settings = await prisma.whatsAppSettings.create({
        data: { messageTitle: 'Booking Confirmation', messageTemplate: defaultTemplate, imageUrl: null, isActive: true }
      });
    }
    res.json(settings);
  } catch (error) {
    console.error('Failed to reset WhatsApp settings:', error);
    res.status(500).json({ error: 'Failed to reset settings' });
  }
});

export default router;
