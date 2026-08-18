/**
 * Professional HTML Email Templates for TripNova notifications.
 * Fully mobile responsive and styled with HSL tailored brand colors.
 */

interface BaseTemplateOptions {
  title: string;
  previewTextText: string;
  contentHtml: string;
}

const getBaseTemplate = ({ title, previewTextText, contentHtml }: BaseTemplateOptions): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #334155;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 20px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      border: 1px border #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -0.05em;
      margin: 0 0 8px 0;
      text-transform: uppercase;
    }
    .header-title {
      font-size: 18px;
      font-weight: 700;
      color: #e2e8f0;
      margin: 0;
    }
    .content {
      padding: 32px 24px;
    }
    .content p {
      font-size: 16px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 16px 0;
    }
    .content h2 {
      font-size: 20px;
      font-weight: 800;
      color: #1e293b;
      margin: 24px 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #f1f5f9;
    }
    .info-grid {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .info-grid td {
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
    }
    .info-label {
      font-weight: 700;
      color: #64748b;
      width: 35%;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .info-value {
      color: #1e293b;
      font-size: 15px;
      font-weight: 600;
    }
    .financials-card {
      background-color: #f8fafc;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #e2e8f0;
      margin: 24px 0;
    }
    .financials-title {
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin: 0 0 12px 0;
    }
    .financials-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 15px;
    }
    .financials-row.total {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 2px dashed #cbd5e1;
      font-size: 18px;
      font-weight: 900;
      color: #1e293b;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .status-confirmed {
      background-color: #dcfce7;
      color: #15803d;
    }
    .status-pending {
      background-color: #fef3c7;
      color: #b45309;
    }
    .status-failed {
      background-color: #fee2e2;
      color: #b91c1c;
    }
    .instructions-box {
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      border-radius: 0 12px 12px 0;
      padding: 16px;
      margin: 24px 0;
    }
    .instructions-title {
      font-weight: 800;
      color: #1d4ed8;
      margin-bottom: 8px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .footer {
      background-color: #f1f5f9;
      padding: 24px;
      text-align: center;
      font-size: 13px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
    }
    .footer a {
      color: #4f46e5;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-text">TripNova</div>
        <div class="header-title">${title}</div>
      </div>
      <div class="content">
        ${contentHtml}
      </div>
      <div class="footer">
        <p>This is an automated notification regarding your booking on <a href="https://tripnova.com">TripNova</a>.</p>
        <p>For support, contact us at <strong>support@tripnova.com</strong> or call <strong>+91 9632463347</strong>.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

export const getBookingReceivedTemplate = (booking: any): string => {
  const tripDate = new Date(booking.trip.startDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const contentHtml = `
    <p>Hello <strong>${booking.travelerName}</strong>,</p>
    <p>Thank you for submitting your booking request! We have received your details, and your booking is currently marked as <strong>PENDING</strong> verification.</p>
    
    <h2>Trip & Booking Details</h2>
    <table class="info-grid">
      <tr>
        <td class="info-label">Booking Ref</td>
        <td class="info-value font-mono">#${booking.bookingRef}</td>
      </tr>
      <tr>
        <td class="info-label">Trip</td>
        <td class="info-value">${booking.trip.title}</td>
      </tr>
      <tr>
        <td class="info-label">Destination</td>
        <td class="info-value">${booking.trip.destination}</td>
      </tr>
      <tr>
        <td class="info-label">Travel Date</td>
        <td class="info-value">${tripDate}</td>
      </tr>
      <tr>
        <td class="info-label">Travelers</td>
        <td class="info-value">${booking.seatCount} Seat(s)</td>
      </tr>
      <tr>
        <td class="info-label">Pickup Point</td>
        <td class="info-value">${booking.pickupPoint || 'N/A'}</td>
      </tr>
    </table>

    <div class="financials-card">
      <div class="financials-title">Payment Summary</div>
      <div class="financials-row">
        <span>Total Booking Amount</span>
        <span>₹${booking.totalAmount.toLocaleString()}</span>
      </div>
      <div class="financials-row">
        <span>Amount Paid (Pending Verification)</span>
        <span>₹${(booking.paidAmount || 0).toLocaleString()}</span>
      </div>
      <div class="financials-row total">
        <span>Payment Status</span>
        <span class="status-badge status-pending">Pending Verification</span>
      </div>
    </div>

    <div class="instructions-box">
      <div class="instructions-title">What Happens Next?</div>
      <p style="margin: 0; font-size: 14px; color: #1e3a8a;">
        Our team is currently verifying your payment screenshot or online transaction. Once verified, you will receive a separate confirmation receipt email with trip details, group coordinates, and guidelines.
      </p>
    </div>
  `;

  return getBaseTemplate({
    title: `Booking Received — ${booking.trip.title}`,
    previewTextText: `Your booking request #${booking.bookingRef} has been received.`,
    contentHtml,
  });
};

export const getPaymentConfirmedTemplate = (booking: any, newlyPaid: number, previousPaid: number): string => {
  const totalPaid = previousPaid + newlyPaid;
  const pendingAmount = Math.max(booking.totalAmount - totalPaid, 0);
  const tripDate = new Date(booking.trip.startDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const isPartial = pendingAmount > 0;

  const contentHtml = `
    <p>Hello <strong>${booking.travelerName}</strong>,</p>
    <p>Good news! We have successfully verified your payment transaction for booking reference <strong>#${booking.bookingRef}</strong>.</p>
    
    <h2>${isPartial ? 'Partial Payment Confirmed' : 'Payment Confirmed'}</h2>
    
    <div class="financials-card">
      <div class="financials-title">Payment Receipt</div>
      <div class="financials-row">
        <span>Trip</span>
        <span>${booking.trip.title}</span>
      </div>
      <div class="financials-row">
        <span>Travel Date</span>
        <span>${tripDate}</span>
      </div>
      <div class="financials-row">
        <span>Total Booking Amount</span>
        <span>₹${booking.totalAmount.toLocaleString()}</span>
      </div>
      <div class="financials-row">
        <span>Previously Paid</span>
        <span>₹${previousPaid.toLocaleString()}</span>
      </div>
      <div class="financials-row" style="font-weight: 700; color: #059669;">
        <span>Current Payment Approved</span>
        <span>₹${newlyPaid.toLocaleString()}</span>
      </div>
      <div class="financials-row">
        <span>Total Cumulative Paid</span>
        <span>₹${totalPaid.toLocaleString()}</span>
      </div>
      <div class="financials-row total">
        <span>Remaining Balance</span>
        <span>₹${pendingAmount.toLocaleString()}</span>
      </div>
    </div>

    ${isPartial ? `
    <div class="instructions-box" style="border-left-color: #d97706; background-color: #fffbeb;">
      <div class="instructions-title" style="color: #b45309;">Outstanding Balance Reminder</div>
      <p style="margin: 0; font-size: 14px; color: #78350f;">
        Please note that a pending balance of <strong>₹${pendingAmount.toLocaleString()}</strong> remains. You can submit your balance payment screenshot through your booking status page.
      </p>
    </div>
    ` : `
    <div class="instructions-box" style="border-left-color: #059669; background-color: #ecfdf5;">
      <div class="instructions-title" style="color: #047857;">Payment Fully Confirmed</div>
      <p style="margin: 0; font-size: 14px; color: #065f46;">
        Your booking is fully paid! No outstanding balance remains. Thank you for completed transactions.
      </p>
    </div>
    `}
  `;

  return getBaseTemplate({
    title: `Payment Confirmed — ${booking.bookingRef}`,
    previewTextText: `Payment verified successfully for booking #${booking.bookingRef}.`,
    contentHtml,
  });
};

export const getPaymentPendingTemplate = (booking: any): string => {
  const pendingAmount = Math.max(booking.totalAmount - booking.paidAmount, 0);

  const contentHtml = `
    <p>Hello <strong>${booking.travelerName}</strong>,</p>
    <p>This is a reminder that payment is currently pending for your booking request on <strong>${booking.trip.title}</strong>.</p>
    
    <div class="financials-card">
      <div class="financials-title">Payment Outstanding</div>
      <div class="financials-row">
        <span>Booking Reference</span>
        <span class="font-mono">#${booking.bookingRef}</span>
      </div>
      <div class="financials-row">
        <span>Total Booking Price</span>
        <span>₹${booking.totalAmount.toLocaleString()}</span>
      </div>
      <div class="financials-row">
        <span>Already Paid</span>
        <span>₹${booking.paidAmount.toLocaleString()}</span>
      </div>
      <div class="financials-row total" style="color: #b45309;">
        <span>Pending Balance</span>
        <span>₹${pendingAmount.toLocaleString()}</span>
      </div>
    </div>

    <h2>Payment Instructions</h2>
    <p>To confirm your slots, please complete your payment to the official account details below and submit your payment receipt screenshot on the portal:</p>
    
    <div class="instructions-box" style="border-left-color: #4f46e5; background-color: #f5f3ff;">
      <div class="instructions-title" style="color: #4338ca;">UPI / Bank Details</div>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #3730a3;">
        <strong>UPI ID:</strong> mysurutravelsclub@ybl<br>
        <strong>PhonePe / GooglePay:</strong> +91 9632463347
      </p>
      <p style="margin: 0; font-size: 13px; color: #4338ca; font-style: italic;">
        *Important: Make sure to upload the payment screenshot on your booking status page after payment.
      </p>
    </div>
  `;

  return getBaseTemplate({
    title: `Payment Pending — ${booking.bookingRef}`,
    previewTextText: `Payment is pending for booking #${booking.bookingRef}.`,
    contentHtml,
  });
};

export const getBookingConfirmedTemplate = (booking: any): string => {
  const tripDate = new Date(booking.trip.startDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const contentHtml = `
    <p>Hello <strong>${booking.travelerName}</strong>,</p>
    <p>Congratulations! Your booking for <strong>${booking.trip.title}</strong> has been **CONFIRMED** by our operations team! Your seats are locked.</p>
    
    <h2>Confirmed Reservation Summary</h2>
    <table class="info-grid">
      <tr>
        <td class="info-label">Booking Ref</td>
        <td class="info-value font-mono">#${booking.bookingRef}</td>
      </tr>
      <tr>
        <td class="info-label">Trip Title</td>
        <td class="info-value">${booking.trip.title}</td>
      </tr>
      <tr>
        <td class="info-label">Start Date</td>
        <td class="info-value">${tripDate}</td>
      </tr>
      <tr>
        <td class="info-label">Total Seats</td>
        <td class="info-value">${booking.seatCount} Seat(s)</td>
      </tr>
      <tr>
        <td class="info-label">Pickup Point</td>
        <td class="info-value">${booking.pickupPoint || 'N/A'}</td>
      </tr>
    </table>

    <div class="instructions-box" style="border-left-color: #059669; background-color: #ecfdf5;">
      <div class="instructions-title" style="color: #047857;">Travel Instructions</div>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #065f46;">
        1. Please arrive at your selected pickup point 15 minutes before departure.<br>
        2. Keep a soft copy of this email or booking reference ready for group check-in.<br>
        3. Bring personal ID proof (Aadhaar/Driver's License).
      </p>
      <p style="margin: 0; font-size: 13px; color: #047857; font-weight: bold;">
        We will add you to the trip WhatsApp group 24-48 hours before departure. Let's make memories!
      </p>
    </div>
  `;

  return getBaseTemplate({
    title: `Booking Confirmed — ${booking.trip.title}`,
    previewTextText: `Your reservation #${booking.bookingRef} is officially confirmed!`,
    contentHtml,
  });
};

export const getBookingCancelledTemplate = (booking: any): string => {
  const reason = booking.adminNotes || 'Requested by customer or seats unavailable';

  const contentHtml = `
    <p>Hello <strong>${booking.travelerName}</strong>,</p>
    <p>This email confirms that your booking request with reference <strong>#${booking.bookingRef}</strong> has been **CANCELLED**.</p>
    
    <div class="instructions-box" style="border-left-color: #dc2626; background-color: #fef2f2;">
      <div class="instructions-title" style="color: #b91c1c;">Cancellation Details</div>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #7f1d1d;">
        <strong>Reason:</strong> ${reason}<br>
        <strong>Amount Paid:</strong> ₹${booking.paidAmount.toLocaleString()}<br>
      </p>
      <p style="margin: 0; font-size: 13px; color: #b91c1c;">
        If you are entitled to a refund, our accounts team will contact you shortly. For questions, reach out with your booking reference.
      </p>
    </div>
  `;

  return getBaseTemplate({
    title: `Booking Cancelled — ${booking.bookingRef}`,
    previewTextText: `Booking #${booking.bookingRef} has been cancelled.`,
    contentHtml,
  });
};

export const getPaymentRejectedTemplate = (booking: any, amount: number, reason: string): string => {
  const contentHtml = `
    <p>Hello <strong>${booking.travelerName}</strong>,</p>
    <p>We were unable to verify your payment transaction for booking reference <strong>#${booking.bookingRef}</strong>.</p>
    
    <div class="instructions-box" style="border-left-color: #dc2626; background-color: #fef2f2;">
      <div class="instructions-title" style="color: #b91c1c;">Verification Failed</div>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #7f1d1d;">
        <strong>Amount Submitted:</strong> ₹${amount.toLocaleString()}<br>
        <strong>Reason for Failure:</strong> ${reason || 'Screenshot illegible or transaction ID not found'}<br>
      </p>
      <p style="margin: 0; font-size: 13px; color: #b91c1c; font-weight: bold;">
        Please log in to your booking status page and upload a valid screenshot showing transaction reference details.
      </p>
    </div>
  `;

  return getBaseTemplate({
    title: `Payment Verification Failed — ${booking.bookingRef}`,
    previewTextText: `Payment verification failed for booking #${booking.bookingRef}.`,
    contentHtml,
  });
};
