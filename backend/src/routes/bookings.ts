import { Router } from 'express';
import prisma from '../config/database';
import { authenticateAdmin } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure Multer for screenshot uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'screenshot-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only images are allowed!'));
  }
});

// CREATE booking (public)
router.post('/', async (req, res) => {
  try {
    const {
      tripId, travelerName, email, phone, age, gender,
      emergencyName, emergencyPhone, idProofUrl, seatCount = 1, specialRequests,
      totalAmount, isManualPayment = false, pickupPoint
    } = req.body;

    // Enforce email suspension check
    const bannedSetting = await prisma.siteSetting.findUnique({ where: { key: 'banned_emails' } });
    if (bannedSetting) {
      const bannedEmails = JSON.parse(bannedSetting.value);
      if (Array.isArray(bannedEmails) && bannedEmails.includes(email.toLowerCase().trim())) {
        res.status(400).json({ error: 'Access Denied: This email account has been suspended by the administrator.' });
        return;
      }
    }

    // Validate trip exists and has seats
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }
    if (trip.availableSeats < seatCount) {
      res.status(400).json({ error: 'Not enough seats available' });
      return;
    }

    const bookingRef = `TN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const finalAmount = totalAmount || (trip.price * seatCount);

    const booking = await prisma.booking.create({
      data: {
        tripId,
        travelerName,
        email,
        phone,
        age: parseInt(age),
        gender,
        emergencyName,
        emergencyPhone,
        idProofUrl: idProofUrl || null,
        seatCount,
        specialRequests: specialRequests || null,
        totalAmount: finalAmount,
        bookingRef,
        isManualPayment,
        pickupPoint,
        status: isManualPayment ? 'PENDING_APPROVAL' : 'PENDING'
      },
      include: { trip: { select: { title: true, destination: true, startDate: true } } },
    });

    // Decrement available seats
    await prisma.trip.update({
      where: { id: tripId },
      data: { availableSeats: { decrement: seatCount } },
    });

    res.status(201).json({ booking });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE booking with payment screenshot (manual payment)
router.patch('/:id/screenshot', upload.single('screenshot'), async (req: any, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Please upload a screenshot' });
      return;
    }

    const screenshotUrl = `/uploads/${req.file.filename}`;
    
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { 
        paymentScreenshot: screenshotUrl,
        status: 'PENDING_APPROVAL'
      }
    });

    res.json({ message: 'Screenshot uploaded, awaiting admin approval', booking });
  } catch (error) {
    console.error('Screenshot upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET all bookings (admin)
router.get('/', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { status, tripId, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const where: any = {};
    if (status) where.status = status;
    if (tripId) where.tripId = tripId;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          trip: { select: { title: true, destination: true } },
          payment: true,
        },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      bookings,
      pagination: { total, page: parseInt(page as string), pages: Math.ceil(total / parseInt(limit as string)) },
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET booking by ref (public - for confirmation page)
router.get('/ref/:ref', async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { bookingRef: req.params.ref },
      include: {
        trip: { select: { title: true, destination: true, startDate: true, endDate: true, coverImage: true } },
        payment: true,
      },
    });
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE booking status (admin - for approval)
router.patch('/:id/status', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(booking);
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
