import { Router } from 'express';
import prisma from '../config/database';
import { authenticateAdmin } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';
import { sendNotification } from '../utils/notifier';
import { uploadBufferToCloudinary, deleteAssetFromUrl } from '../utils/cloudinary';
import { sendEmailByType } from '../services/emailService';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const router = Router();

const getPendingPaymentAmount = (paymentHistory: Array<{ amount: number; status: string }> = []) =>
  paymentHistory
    .filter((payment) => payment.status === 'PENDING')
    .reduce((sum, payment) => sum + payment.amount, 0);

const attachBookingFinancials = (booking: any) => {
  const pendingPaymentAmount = getPendingPaymentAmount(booking.paymentHistory || []);
  const displayPaidAmount = (booking.paidAmount || 0) + pendingPaymentAmount;
  const pendingAmount = Math.max(booking.totalAmount - displayPaidAmount, 0);

  return {
    ...booking,
    displayPaidAmount,
    pendingAmount,
  };
};

// Configure Multer for screenshot uploads to memory
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only images are allowed!'));
  }
});

// Helper to save file locally
const saveFileLocally = async (file: any, subfolder = 'uploads') => {
  const uploadDir = path.join(__dirname, `../../${subfolder}`);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const fileExt = path.extname(file.originalname) || `.${file.mimetype.split('/')[1]}` || '.bin';
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${fileExt}`;
  const filePath = path.join(uploadDir, filename);
  
  await fs.promises.writeFile(filePath, file.buffer);
  return `/${subfolder}/${filename}`;
};

// Helper to get backend base URL
const getBackendUrl = (req: any) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${config.port}`;
  return `${protocol}://${host}`;
};

// CREATE booking (public)
router.post('/', async (req, res) => {
  try {
    const {
      tripId, travelerName, email, phone, age, gender,
      emergencyName, emergencyPhone, idProofUrl, seatCount = 1, specialRequests,
      paymentAmount, paymentType, isManualPayment = false, pickupPoint
    } = req.body;
    const parsedSeatCount = Math.max(parseInt(seatCount, 10) || 1, 1);

    // Enforce email suspension check
    if (email) {
      const bannedSetting = await prisma.siteSetting.findUnique({ where: { key: 'banned_emails' } });
      if (bannedSetting) {
        const bannedEmails = JSON.parse(bannedSetting.value);
        if (Array.isArray(bannedEmails) && bannedEmails.includes(email.toLowerCase().trim())) {
          res.status(400).json({ error: 'Access Denied: This email account has been suspended by the administrator.' });
          return;
        }
      }
    }

    const bookingRef = `TN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    let booking;
    try {
      booking = await prisma.$transaction(async (tx) => {
        // Validate trip exists and has seats
        const trip = await tx.trip.findUnique({ where: { id: tripId } });
        if (!trip) {
          throw new Error('TRIP_NOT_FOUND');
        }
        if (trip.availableSeats < parsedSeatCount) {
          throw new Error('NOT_ENOUGH_SEATS');
        }

        const finalAmount = trip.price * parsedSeatCount;
        const minimumPartialAmount = trip.partialPaymentEnabled && trip.partialPaymentAmount
          ? trip.partialPaymentAmount * parsedSeatCount
          : null;
        const requestedPaymentAmount = parseFloat(paymentAmount);

        if (paymentType === 'PARTIAL') {
          const minPartial = minimumPartialAmount || Math.round(finalAmount * 0.3);
          if (!Number.isNaN(requestedPaymentAmount) && (requestedPaymentAmount < minPartial || requestedPaymentAmount >= finalAmount)) {
            throw new Error('INVALID_PARTIAL_AMOUNT');
          }
        } else if (!Number.isNaN(requestedPaymentAmount) && Math.abs(requestedPaymentAmount - finalAmount) > 0.01) {
          throw new Error('INVALID_FULL_AMOUNT');
        }

        let user = await tx.user.findUnique({ where: { mobileNumber: phone } });
        if (!user) {
          user = await tx.user.create({
            data: {
              fullName: travelerName,
              mobileNumber: phone,
            }
          });
        } else if (user.fullName !== travelerName) {
          await tx.user.update({ where: { id: user.id }, data: { fullName: travelerName } });
        }

        const createdBooking = await tx.booking.create({
          data: {
            userId: user.id,
            tripId,
            travelerName,
            email: email || null,
            phone,
            age: age ? parseInt(age) : null,
            gender: gender || null,
            emergencyName: emergencyName || null,
            emergencyPhone: emergencyPhone || null,
            idProofUrl: idProofUrl || null,
            seatCount: parsedSeatCount,
            specialRequests: specialRequests || null,
            totalAmount: finalAmount,
            bookingRef,
            isManualPayment,
            pickupPoint,
            status: 'PENDING',
            paidAmount: 0,
            paymentStatus: 'PENDING_PAYMENT',
          },
          include: { trip: { select: { title: true, destination: true, startDate: true } } },
        });

        // Decrement available seats
        await tx.trip.update({
          where: { id: tripId },
          data: { availableSeats: { decrement: parsedSeatCount } },
        });

        return createdBooking;
      });
    } catch (err: any) {
      if (err.message === 'TRIP_NOT_FOUND') {
        res.status(404).json({ error: 'Trip not found' });
        return;
      }
      if (err.message === 'NOT_ENOUGH_SEATS') {
        res.status(400).json({ error: 'Not enough seats available' });
        return;
      }
      if (err.message === 'PARTIAL_PAYMENT_NOT_AVAILABLE') {
        res.status(400).json({ error: 'Partial payment is not available for this trip' });
        return;
      }
      if (err.message === 'INVALID_PARTIAL_AMOUNT') {
        res.status(400).json({ error: 'Invalid partial payment amount for this trip' });
        return;
      }
      if (err.message === 'INVALID_FULL_AMOUNT') {
        res.status(400).json({ error: 'Invalid full payment amount for this trip' });
        return;
      }
      throw err;
    }

    if (booking.email) {
      sendEmailByType(booking.id, 'BOOKING_RECEIVED').catch((err) => 
        console.error('Failed to dispatch booking received email:', err.message)
      );
    }

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

    const isCloudinaryConfigured = 
      config.cloudinary.cloudName && 
      config.cloudinary.cloudName !== 'your_cloud_name_here' &&
      config.cloudinary.apiKey && 
      config.cloudinary.apiKey !== 'your_api_key_here' &&
      config.cloudinary.apiSecret && 
      config.cloudinary.apiSecret !== 'your_api_secret_here';

    let screenshotUrl = '';

    if (!isCloudinaryConfigured) {
      // Fallback to local storage for development/sandbox settings
      const relativeUrl = await saveFileLocally(req.file, 'uploads');
      screenshotUrl = `${getBackendUrl(req)}${relativeUrl}`;
    } else {
      // Upload to Cloudinary using unified utility
      const result = await uploadBufferToCloudinary(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname,
        'screenshot'
      );
      screenshotUrl = result.secure_url;
    }

    // Fetch the booking details to fall back to its totalAmount if needed
    const bookingToUpdate = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!bookingToUpdate) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    const fallbackAmount = Math.max(bookingToUpdate.totalAmount - bookingToUpdate.paidAmount, 0);
    const amount = parseFloat(req.body.amount || fallbackAmount.toString());

    // Create a pending PaymentHistory entry
    await prisma.paymentHistory.create({
      data: {
        bookingId: req.params.id,
        amount,
        screenshot: screenshotUrl,
        method: 'UPI',
        status: 'PENDING',
        notes: req.body.notes || 'Submitted by customer'
      }
    });
    
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { 
        paymentScreenshot: screenshotUrl,
        status: 'PENDING_VERIFICATION'
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
          trip: { select: { title: true, destination: true, startDate: true } },
          payment: true,
          paymentHistory: { orderBy: { createdAt: 'desc' } },
          notifications: { orderBy: { createdAt: 'desc' }, take: 1 },
          emailLogs: { orderBy: { createdAt: 'desc' } }
        },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      bookings: bookings.map((booking) => attachBookingFinancials(booking)),
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
        paymentHistory: { orderBy: { createdAt: 'desc' } },
        emailLogs: { orderBy: { createdAt: 'desc' } }
      },
    });
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    res.json(attachBookingFinancials(booking));
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE booking details (admin - general update)
router.patch('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { travelerName, phone, seatCount, totalAmount, paidAmount, paymentStatus, status, adminNotes } = req.body;
    const currentBooking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!currentBooking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const updateData: any = {};
    if (travelerName !== undefined) updateData.travelerName = travelerName;
    if (phone !== undefined) updateData.phone = phone;
    if (seatCount !== undefined) updateData.seatCount = isNaN(parseInt(seatCount)) ? undefined : parseInt(seatCount);
    if (totalAmount !== undefined) updateData.totalAmount = isNaN(parseFloat(totalAmount)) ? undefined : parseFloat(totalAmount);
    if (paidAmount !== undefined) updateData.paidAmount = isNaN(parseFloat(paidAmount)) ? undefined : parseFloat(paidAmount);
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (status !== undefined) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const updatedBooking = await prisma.booking.update({
      where: { id: req.params.id },
      data: updateData,
    });

    await prisma.adminLog.create({
      data: {
        adminName: req.admin?.email || 'System',
        action: `BOOKING_UPDATE`,
        details: `Updated booking details for ${currentBooking.bookingRef}`,
      }
    });

    res.json(attachBookingFinancials(updatedBooking));
  } catch (error) {
    console.error('Update booking details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE booking status (admin - for approval/rejection)
router.patch('/:id/status', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { status, adminNotes } = req.body;
    
    const currentBooking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { trip: true }
    });

    if (!currentBooking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const updateData: any = { status };
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    if (status === 'CONFIRMED' && currentBooking.status !== 'CONFIRMED') {
      // Find all pending payments for this booking
      const pendingPayments = await prisma.paymentHistory.findMany({
        where: { bookingId: req.params.id, status: 'PENDING' }
      });
      
      let amountToVerify = 0;
      if (pendingPayments.length > 0) {
        // Mark them as verified
        await prisma.paymentHistory.updateMany({
          where: { bookingId: req.params.id, status: 'PENDING' },
          data: { status: 'VERIFIED' }
        });
        amountToVerify = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
      } else {
        // If there are no payments at all (e.g. legacy booking), default to full totalAmount
        if (currentBooking.paidAmount === 0) {
          await prisma.paymentHistory.create({
            data: {
              bookingId: req.params.id,
              amount: currentBooking.totalAmount,
              method: currentBooking.isManualPayment ? 'MANUAL' : 'RAZORPAY',
              status: 'VERIFIED',
              notes: 'Auto-verified on confirmation'
            }
          });
          amountToVerify = currentBooking.totalAmount;
        }
      }
      
      const newPaidAmount = currentBooking.paidAmount + amountToVerify;
      const newPaymentStatus = newPaidAmount >= currentBooking.totalAmount ? 'FULLY_PAID' : (newPaidAmount > 0 ? 'PARTIALLY_PAID' : 'PENDING_PAYMENT');
      
      updateData.paidAmount = newPaidAmount;
      updateData.paymentStatus = newPaymentStatus;
    } else if (status === 'REJECTED') {
      await prisma.paymentHistory.updateMany({
        where: { bookingId: req.params.id, status: 'PENDING' },
        data: { status: 'REJECTED', notes: adminNotes || 'Rejected by admin' }
      });
    }

    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: updateData,
    });

    const isNowCancelled = status === 'REJECTED' || status === 'CANCELLED';
    const wasCancelled = currentBooking.status === 'REJECTED' || currentBooking.status === 'CANCELLED';

    if (isNowCancelled && !wasCancelled) {
      await prisma.trip.update({
        where: { id: currentBooking.tripId },
        data: { availableSeats: { increment: currentBooking.seatCount } },
      });
    } else if (!isNowCancelled && wasCancelled) {
      await prisma.trip.update({
        where: { id: currentBooking.tripId },
        data: { availableSeats: { decrement: currentBooking.seatCount } },
      });
    }

    if (status === 'CONFIRMED' && currentBooking.status !== 'CONFIRMED') {
      const verifiedAmount = updateData.paidAmount !== undefined
        ? updateData.paidAmount - currentBooking.paidAmount
        : 0;
      const pendingAmount = Math.max(currentBooking.totalAmount - (updateData.paidAmount ?? currentBooking.paidAmount), 0);

      if (currentBooking.userId) {
        await prisma.user.update({
          where: { id: currentBooking.userId },
          data: { totalTrips: { increment: 1 }, totalSpent: { increment: verifiedAmount } }
        });
      }
      const pendingLine = pendingAmount > 0 ? `\n\nPending amount: Rs. ${pendingAmount.toLocaleString()}` : '';
      const message = `Hello ${currentBooking.travelerName},\n\nYour payment for ${currentBooking.trip.title} has been successfully verified.${pendingLine}\n\nThank you for booking with Mysuru Travel Club.\n\nPlease reply with your pickup location from the available pickup points mentioned in the trip details.\n\nFor assistance contact:\n9632463347`;
      await sendNotification(currentBooking.id, currentBooking.phone, message);
    } else if (status === 'REJECTED' && currentBooking.status === 'CONFIRMED') {
      if (currentBooking.userId) {
        await prisma.user.update({
          where: { id: currentBooking.userId },
          data: { totalTrips: { decrement: 1 }, totalSpent: { decrement: currentBooking.paidAmount } }
        });
      }
    }

    await prisma.adminLog.create({
      data: {
        adminName: req.admin?.email || 'System',
        action: `BOOKING_STATUS_UPDATE`,
        details: `Updated booking ${currentBooking.bookingRef} to ${status}`,
      }
    });

    // Dispatch transactional non-blocking email notifications
    if (booking.email || currentBooking.email) {
      if (status === 'CONFIRMED' && currentBooking.status !== 'CONFIRMED') {
        sendEmailByType(booking.id, 'PAYMENT_CONFIRMED').catch(console.error);
        sendEmailByType(booking.id, 'BOOKING_CONFIRMED').catch(console.error);
      } else if (status === 'REJECTED') {
        sendEmailByType(booking.id, 'PAYMENT_REJECTED').catch(console.error);
      } else if (status === 'CANCELLED') {
        sendEmailByType(booking.id, 'BOOKING_CANCELLED').catch(console.error);
      }
    }

    res.json(booking);
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE booking (admin)
router.delete('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id }
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // Revert available seats if it wasn't cancelled or rejected
    if (booking.status !== 'REJECTED' && booking.status !== 'CANCELLED') {
      await prisma.trip.update({
        where: { id: booking.tripId },
        data: { availableSeats: { increment: booking.seatCount } },
      });
    }

    if (booking.status === 'CONFIRMED' && booking.userId) {
      await prisma.user.update({
        where: { id: booking.userId },
        data: { totalTrips: { decrement: 1 }, totalSpent: { decrement: booking.paidAmount } }
      });
    }

    // Cleanup associated Cloudinary files
    if (booking.idProofUrl) {
      await deleteAssetFromUrl(booking.idProofUrl);
    }
    if (booking.paymentScreenshot) {
      await deleteAssetFromUrl(booking.paymentScreenshot);
    }

    // Cleanup related payment history screenshots
    const histories = await prisma.paymentHistory.findMany({
      where: { bookingId: booking.id }
    });
    for (const history of histories) {
      if (history.screenshot) {
        await deleteAssetFromUrl(history.screenshot);
      }
    }

    await prisma.booking.delete({
      where: { id: req.params.id }
    });

    await prisma.adminLog.create({
      data: {
        adminName: req.admin?.email || 'System',
        action: 'BOOKING_DELETE',
        details: `Deleted booking ${booking.bookingRef} for ${booking.travelerName}`,
      }
    });

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST bulk update bookings (admin)
router.post('/bulk-update', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { bookingIds, action } = req.body; // action: 'CONFIRM', 'REJECT', 'DELETE'
    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      res.status(400).json({ error: 'No bookings selected' });
      return;
    }

    const bookings = await prisma.booking.findMany({
      where: { id: { in: bookingIds } },
      include: { trip: true }
    });

    const adminEmail = req.admin?.email || 'System';

    if (action === 'DELETE') {
      for (const booking of bookings) {
        if (booking.status !== 'REJECTED' && booking.status !== 'CANCELLED') {
          await prisma.trip.update({
            where: { id: booking.tripId },
            data: { availableSeats: { increment: booking.seatCount } }
          });
        }
        if (booking.status === 'CONFIRMED' && booking.userId) {
          await prisma.user.update({
            where: { id: booking.userId },
            data: { totalTrips: { decrement: 1 }, totalSpent: { decrement: booking.paidAmount } }
          });
        }
      }
      await prisma.booking.deleteMany({
        where: { id: { in: bookingIds } }
      });
      await prisma.adminLog.create({
        data: {
          adminName: adminEmail,
          action: 'BULK_BOOKING_DELETE',
          details: `Deleted ${bookingIds.length} bookings`,
        }
      });
    } else {
      const newStatus = action === 'CONFIRM' ? 'CONFIRMED' : 'REJECTED';
      
      for (const booking of bookings) {
        const isNowCancelled = newStatus === 'REJECTED';
        const wasCancelled = booking.status === 'REJECTED' || booking.status === 'CANCELLED';
        const updateData: any = { status: newStatus };

        if (isNowCancelled && !wasCancelled) {
          await prisma.trip.update({
            where: { id: booking.tripId },
            data: { availableSeats: { increment: booking.seatCount } },
          });
        } else if (!isNowCancelled && wasCancelled) {
          await prisma.trip.update({
            where: { id: booking.tripId },
            data: { availableSeats: { decrement: booking.seatCount } },
          });
        }

        if (newStatus === 'CONFIRMED' && booking.status !== 'CONFIRMED') {
          const pendingPayments = await prisma.paymentHistory.findMany({
            where: { bookingId: booking.id, status: 'PENDING' }
          });

          let amountToVerify = 0;
          if (pendingPayments.length > 0) {
            await prisma.paymentHistory.updateMany({
              where: { bookingId: booking.id, status: 'PENDING' },
              data: { status: 'VERIFIED' }
            });
            amountToVerify = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
          } else if (booking.paidAmount === 0) {
            await prisma.paymentHistory.create({
              data: {
                bookingId: booking.id,
                amount: booking.totalAmount,
                method: booking.isManualPayment ? 'MANUAL' : 'RAZORPAY',
                status: 'VERIFIED',
                notes: 'Auto-verified in bulk confirmation'
              }
            });
            amountToVerify = booking.totalAmount;
          }

          const newPaidAmount = booking.paidAmount + amountToVerify;
          updateData.paidAmount = newPaidAmount;
          updateData.paymentStatus = newPaidAmount >= booking.totalAmount ? 'FULLY_PAID' : (newPaidAmount > 0 ? 'PARTIALLY_PAID' : 'PENDING_PAYMENT');

          if (booking.userId) {
            await prisma.user.update({
              where: { id: booking.userId },
              data: { totalTrips: { increment: 1 }, totalSpent: { increment: amountToVerify } }
            });
          }
        } else if (newStatus === 'REJECTED') {
          await prisma.paymentHistory.updateMany({
            where: { bookingId: booking.id, status: 'PENDING' },
            data: { status: 'REJECTED', notes: 'Rejected in bulk action' }
          });

          if (booking.status === 'CONFIRMED' && booking.userId) {
            await prisma.user.update({
              where: { id: booking.userId },
              data: { totalTrips: { decrement: 1 }, totalSpent: { decrement: booking.paidAmount } }
            });
          }
        }

        await prisma.booking.update({
          where: { id: booking.id },
          data: updateData
        });
        
        if (newStatus === 'CONFIRMED' && booking.status !== 'CONFIRMED') {
          const pendingAmount = Math.max(booking.totalAmount - (updateData.paidAmount ?? booking.paidAmount), 0);
          const pendingLine = pendingAmount > 0 ? `\n\nPending amount: Rs. ${pendingAmount.toLocaleString()}` : '';
          const message = `Hello ${booking.travelerName},\n\nYour payment for ${booking.trip.title} has been successfully verified.${pendingLine}\n\nThank you for booking with Mysuru Travel Club.\n\nPlease reply with your pickup location.\n\nFor assistance contact:\n9632463347`;
          await sendNotification(booking.id, booking.phone, message).catch(console.error);
        }
      }

      await prisma.adminLog.create({
        data: {
          adminName: adminEmail,
          action: `BULK_BOOKING_${action}`,
          details: `Updated ${bookingIds.length} bookings to ${newStatus}`,
        }
      });
    }

    res.json({ message: `Successfully executed bulk ${action.toLowerCase()}` });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET all payments for a booking
router.get('/:id/payments', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const payments = await prisma.paymentHistory.findMany({
      where: { bookingId: req.params.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ADD a payment to a booking (direct entry by admin)
router.post('/:id/payments', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { amount, method, notes, date } = req.body;
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      res.status(400).json({ error: 'Invalid payment amount' });
      return;
    }

    // Create verified payment history
    const payment = await prisma.paymentHistory.create({
      data: {
        bookingId: req.params.id,
        amount: paymentAmount,
        method: method || 'MANUAL',
        status: 'VERIFIED',
        notes: notes || 'Recorded by admin',
        date: date ? new Date(date) : new Date()
      }
    });

    // Update booking paidAmount and paymentStatus
    const newPaidAmount = booking.paidAmount + paymentAmount;
    let newPaymentStatus = 'PENDING_PAYMENT';
    if (newPaidAmount >= booking.totalAmount) {
      newPaymentStatus = 'FULLY_PAID';
    } else if (newPaidAmount > 0) {
      newPaymentStatus = 'PARTIALLY_PAID';
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        paidAmount: newPaidAmount,
        paymentStatus: newPaymentStatus,
        status: newPaidAmount >= booking.totalAmount ? 'CONFIRMED' : booking.status
      }
    });

    if (booking.userId) {
      if (booking.status === 'CONFIRMED') {
        await prisma.user.update({
          where: { id: booking.userId },
          data: { totalSpent: { increment: paymentAmount } }
        });
      } else if (updatedBooking.status === 'CONFIRMED') {
        await prisma.user.update({
          where: { id: booking.userId },
          data: { totalTrips: { increment: 1 }, totalSpent: { increment: paymentAmount } }
        });
      }
    }

    await prisma.adminLog.create({
      data: {
        adminName: req.admin?.email || 'System',
        action: 'PAYMENT_ADD',
        details: `Added manual payment of ₹${paymentAmount} to booking ${booking.bookingRef}`
      }
    });

    res.json({ payment, booking: updatedBooking });
  } catch (error) {
    console.error('Add payment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// VERIFY or REJECT a specific payment transaction (admin)
router.patch('/payments/:paymentHistoryId/status', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { status, notes } = req.body; // 'VERIFIED' or 'REJECTED'
    if (status !== 'VERIFIED' && status !== 'REJECTED') {
      res.status(400).json({ error: 'Invalid transaction status' });
      return;
    }

    const payment = await prisma.paymentHistory.findUnique({
      where: { id: req.params.paymentHistoryId },
      include: { booking: true }
    });

    if (!payment) {
      res.status(404).json({ error: 'Payment transaction not found' });
      return;
    }

    if (payment.status !== 'PENDING') {
      res.status(400).json({ error: 'Payment transaction is already processed' });
      return;
    }

    const updatedPayment = await prisma.paymentHistory.update({
      where: { id: req.params.paymentHistoryId },
      data: { status, notes }
    });

    let updatedBooking = payment.booking;
    if (status === 'VERIFIED') {
      const newPaidAmount = payment.booking.paidAmount + payment.amount;
      let newPaymentStatus = 'PENDING_PAYMENT';
      if (newPaidAmount >= payment.booking.totalAmount) {
        newPaymentStatus = 'FULLY_PAID';
      } else if (newPaidAmount > 0) {
        newPaymentStatus = 'PARTIALLY_PAID';
      }

      updatedBooking = await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          paidAmount: newPaidAmount,
          paymentStatus: newPaymentStatus,
          status: 'CONFIRMED'
        }
      });

      if (payment.booking.userId) {
        if (payment.booking.status === 'CONFIRMED') {
          await prisma.user.update({
            where: { id: payment.booking.userId },
            data: { totalSpent: { increment: payment.amount } }
          });
        } else {
          await prisma.user.update({
            where: { id: payment.booking.userId },
            data: { totalTrips: { increment: 1 }, totalSpent: { increment: payment.amount } }
          });
        }
      }
    }

    await prisma.adminLog.create({
      data: {
        adminName: req.admin?.email || 'System',
        action: `PAYMENT_${status}`,
        details: `Marked payment ${payment.id} for booking ${payment.booking.bookingRef} as ${status}`
      }
    });

    res.json({ payment: updatedPayment, booking: updatedBooking });
  } catch (error) {
    console.error('Process payment status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST manual email send (admin only)
router.post('/:id/email/send', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { emailType } = req.body;

    if (!emailType) {
      return res.status(400).json({ error: 'emailType parameter is required' });
    }

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Trigger manual email send (non-blocking)
    sendEmailByType(id, emailType).catch(console.error);
    res.json({ message: `Manual email notification [${emailType}] initiated successfully.` });
  } catch (error: any) {
    console.error('Manual email error:', error);
    res.status(500).json({ error: error.message || 'Failed to dispatch email' });
  }
});

// POST retry failed email log (admin only)
router.post('/:id/email/retry/:logId', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { id, logId } = req.params;
    const log = await prisma.emailLog.findUnique({ where: { id: logId } });
    if (!log) {
      return res.status(404).json({ error: 'Email log not found' });
    }

    // Trigger retry (non-blocking)
    sendEmailByType(id, log.emailType as any, log.id).catch(console.error);
    res.json({ message: 'Email retry initiated successfully.' });
  } catch (error: any) {
    console.error('Email retry error:', error);
    res.status(500).json({ error: error.message || 'Failed to retry email' });
  }
});

export default router;
