import nodemailer from 'nodemailer';
import prisma from '../config/database';
import { config } from '../config';
import * as templates from './emailTemplates';

// Create SMTP Transporter
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

/**
 * Dispatches a transaction email based on booking state.
 * This runs in a non-blocking/asynchronous manner so database operations do not fail if SMTP fails.
 */
export async function sendEmailByType(
  bookingId: string,
  emailType: 'BOOKING_RECEIVED' | 'PAYMENT_CONFIRMED' | 'PAYMENT_PENDING' | 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED' | 'PAYMENT_REJECTED',
  existingLogId?: string
) {
  let logId = existingLogId;
  let recipient = '';

  try {
    // 1. Fetch booking with related trip details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: true, paymentHistory: true }
    });

    if (!booking) {
      throw new Error(`Booking with ID ${bookingId} not found`);
    }

    recipient = booking.email || '';
    if (!recipient) {
      // Fallback: check if the linked user has an email
      if (booking.userId) {
        const linkedUser = await prisma.user.findUnique({ where: { id: booking.userId } });
        recipient = linkedUser?.email || '';
      }
    }

    if (!recipient) {
      throw new Error(`No email recipient address is associated with Booking #${booking.bookingRef}`);
    }

    // 2. Create or find EmailLog record
    if (!logId) {
      const log = await prisma.emailLog.create({
        data: {
          bookingId,
          emailType,
          recipient,
          status: 'pending',
        }
      });
      logId = log.id;
    } else {
      await prisma.emailLog.update({
        where: { id: logId },
        data: { status: 'pending', errorMessage: null }
      });
    }

    // 3. Select Template & Subject
    let html = '';
    let subject = '';

    switch (emailType) {
      case 'BOOKING_RECEIVED':
        html = templates.getBookingReceivedTemplate(booking);
        subject = `Booking Received — ${booking.trip.title} — ${booking.bookingRef}`;
        break;

      case 'PAYMENT_CONFIRMED': {
        const verified = booking.paymentHistory.filter(p => p.status === 'VERIFIED');
        const newlyPaid = verified.length > 0 ? verified[0].amount : booking.paidAmount;
        const previousPaid = Math.max(booking.paidAmount - newlyPaid, 0);
        html = templates.getPaymentConfirmedTemplate(booking, newlyPaid, previousPaid);
        subject = `Payment Confirmed — ${booking.bookingRef}`;
        break;
      }

      case 'PAYMENT_PENDING':
        html = templates.getPaymentPendingTemplate(booking);
        subject = `Payment Pending — ${booking.bookingRef}`;
        break;

      case 'BOOKING_CONFIRMED':
        html = templates.getBookingConfirmedTemplate(booking);
        subject = `Booking Confirmed — ${booking.trip.title} — ${booking.bookingRef}`;
        break;

      case 'BOOKING_CANCELLED':
        html = templates.getBookingCancelledTemplate(booking);
        subject = `Booking Cancelled — ${booking.bookingRef}`;
        break;

      case 'PAYMENT_REJECTED': {
        const rejected = booking.paymentHistory.filter(p => p.status === 'REJECTED');
        const amount = rejected.length > 0 ? rejected[0].amount : 0;
        const reason = rejected.length > 0 ? (rejected[0].notes || 'Rejected by Admin') : 'Rejected';
        html = templates.getPaymentRejectedTemplate(booking, amount, reason);
        subject = `Payment Verification Failed — ${booking.bookingRef}`;
        break;
      }

      default:
        throw new Error(`Unsupported email type: ${emailType}`);
    }

    // 4. Send Email
    const mailOptions = {
      from: `"${config.email.from || 'TripNova'}" <${config.email.user}>`,
      to: recipient,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Email [${emailType}] sent successfully to ${recipient}. MessageId: ${info.messageId}`);

    // 5. Update EmailLog on success
    await prisma.emailLog.update({
      where: { id: logId },
      data: {
        status: 'sent',
        sentAt: new Date(),
      }
    });

  } catch (error: any) {
    console.error(`❌ Email dispatch failed for Booking #${bookingId} [${emailType}]:`, error.message);
    
    // Log failure securely in the DB if logId is created
    if (logId) {
      await prisma.emailLog.update({
        where: { id: logId },
        data: {
          status: 'failed',
          errorMessage: error.message || 'SMTP Connection failed',
        }
      }).catch(err => console.error('Failed to update EmailLog error status:', err.message));
    }
  }
}
