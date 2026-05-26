import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../config/database';

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
});

// Create Order
router.post('/create-order', async (req: any, res: any) => {
  try {
    const { amount, currency = 'INR', bookingId } = req.body;

    const options = {
      amount: Math.round(amount * 100), 
      currency,
      receipt: `receipt_${bookingId}`,
    };

    const order = await razorpay.orders.create(options);

    // Create Payment record
    if (bookingId) {
      await prisma.payment.create({
        data: {
          bookingId,
          razorpayOrderId: order.id,
          amount: parseFloat(amount),
          currency,
          status: 'CREATED'
        }
      });
      
      // Update booking status
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'AWAITING_PAYMENT' }
      });
    }

    res.json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
    });
  } catch (error) {
    console.error('Razorpay Error:', error);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
});

// Verify Payment
router.post('/verify', async (req: any, res: any) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      bookingId 
    } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment successful
      await prisma.$transaction([
        prisma.payment.update({
          where: { razorpayOrderId: razorpay_order_id },
          data: { 
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            status: 'SUCCESS'
          }
        }),
        prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'CONFIRMED' }
        })
      ]);
      
      return res.json({ message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ message: "Invalid signature sent!" });
    }
  } catch (error) {
    console.error('Verification Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
