import { config } from '../config';

/**
 * Sends a WhatsApp message using Twilio API (or standard SMS if preferred)
 * Make sure to provide TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env
 */
export async function sendWhatsAppMessage(toPhone: string, message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioNumber) {
    console.warn('Twilio credentials are not fully configured in .env. Skipping notification.');
    return;
  }

  try {
    // Basic HTTP request to Twilio API to avoid adding a bulky sdk dependency if not strictly needed
    // But since the project is Node, using fetch works well.
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    // Twilio WhatsApp numbers require a "whatsapp:" prefix
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
      console.error('Twilio Error:', errorData);
      throw new Error(`Failed to send WhatsApp message: ${(errorData as any).message}`);
    }

    console.log(`WhatsApp message sent to ${formattedTo}`);
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
  }
}
