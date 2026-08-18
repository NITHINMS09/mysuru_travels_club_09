import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '465');
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  console.log('Testing SMTP connection with:');
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`User: ${user}`);
  console.log(`Pass: ${pass ? '****' : 'UNDEFINED'}`);

  if (!user || !pass) {
    console.error('EMAIL_USER and EMAIL_PASSWORD must be defined in your .env file!');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  try {
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection is verified and ready!');

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM || 'TripNova Test'}" <${user}>`,
      to: user, // Send to self
      subject: 'TripNova SMTP Test Email',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #4f46e5;">TripNova SMTP Test</h2>
          <p>Your SMTP mail configurations are verified and fully operational! 🚀</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">Sent at: ${new Date().toString()}</p>
        </div>
      `
    };

    console.log('Sending test email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error: any) {
    console.error('❌ Verification or sending failed:');
    console.error(error);
  }
}

main();
