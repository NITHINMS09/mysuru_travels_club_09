import prisma from '../config/database';

export async function sendNotification(bookingId: string, toPhone: string, message: string) {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: { key: { in: ['notification_enabled', 'notification_provider', 'twilio_account_sid', 'twilio_auth_token', 'twilio_phone_number'] } }
    });
    const s = settings.reduce((acc: any, curr) => { acc[curr.key] = curr.value; return acc; }, {});

    if (s.notification_enabled !== 'true' || s.notification_provider === 'none') {
      await prisma.notificationLog.create({
        data: {
          bookingId,
          recipient: toPhone,
          provider: 'none',
          message,
          status: 'FAILED',
          error: 'Notifications are disabled or no provider configured'
        }
      });
      return { success: false, error: 'Notifications are disabled or no provider configured' };
    }

    if (s.notification_provider === 'Twilio') {
      const accountSid = s.twilio_account_sid || process.env.TWILIO_ACCOUNT_SID;
      const authToken = s.twilio_auth_token || process.env.TWILIO_AUTH_TOKEN;
      const twilioNumber = s.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !twilioNumber) {
        await prisma.notificationLog.create({
          data: {
            bookingId,
            recipient: toPhone,
            provider: 'Twilio',
            message,
            status: 'FAILED',
            error: 'Twilio credentials missing'
          }
        });
        return { success: false, error: 'Twilio credentials missing' };
      }

      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const formattedTo = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:+91${toPhone.replace(/\D/g, '').slice(-10)}`;
      const formattedFrom = twilioNumber.startsWith('whatsapp:') ? twilioNumber : `whatsapp:${twilioNumber}`;

      const body = new URLSearchParams({
        To: formattedTo,
        From: formattedFrom,
        Body: message
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });

      if (!response.ok) {
        const errorData = await response.json();
        await prisma.notificationLog.create({
          data: {
            bookingId,
            recipient: toPhone,
            provider: 'Twilio',
            message,
            status: 'FAILED',
            error: (errorData as any).message || 'API Error'
          }
        });
        return { success: false, error: (errorData as any).message || 'API Error' };
      }

      await prisma.notificationLog.create({
        data: {
          bookingId,
          recipient: toPhone,
          provider: 'Twilio',
          message,
          status: 'SENT'
        }
      });
      return { success: true };
    }

    // other providers could be added here
    await prisma.notificationLog.create({
      data: {
        bookingId,
        recipient: toPhone,
        provider: s.notification_provider || 'unknown',
        message,
        status: 'FAILED',
        error: `Provider ${s.notification_provider} not implemented`
      }
    });
    return { success: false, error: `Provider ${s.notification_provider} not implemented` };

  } catch (error: any) {
    console.error('Error sending notification:', error);
    await prisma.notificationLog.create({
      data: {
        bookingId,
        recipient: toPhone,
        provider: 'unknown',
        message,
        status: 'FAILED',
        error: error.message
      }
    });
    return { success: false, error: error.message };
  }
}
