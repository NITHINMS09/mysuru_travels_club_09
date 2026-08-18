import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

export const config = {
  port: parseInt(process.env.PORT || '5000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || '',
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '465'),
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || '',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@tripnova.com',
    password: process.env.ADMIN_PASSWORD || 'admin123456',
  },
};

// Validate environment variables and warn on console
if (config.nodeEnv === 'development') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'fallback-secret-change-me') {
    console.warn('\x1b[33m%s\x1b[0m', 'WARNING: JWT_SECRET is not configured or using default fallback. Please secure it in production.');
  }

  const isCloudinarySet = 
    config.cloudinary.cloudName && config.cloudinary.cloudName !== 'your_cloud_name_here' &&
    config.cloudinary.apiKey && config.cloudinary.apiKey !== 'your_api_key_here' &&
    config.cloudinary.apiSecret && config.cloudinary.apiSecret !== 'your_api_secret_here';

  if (!isCloudinarySet) {
    console.warn('\x1b[33m%s\x1b[0m', 'WARNING: Cloudinary is not configured. File uploads will fall back to local disk storage (/uploads).');
  }

  const isRazorpaySet = 
    config.razorpay.keyId && config.razorpay.keyId !== 'rzp_test_placeholder' &&
    config.razorpay.keySecret && config.razorpay.keySecret !== 'placeholder_secret';

  if (!isRazorpaySet) {
    console.warn('\x1b[33m%s\x1b[0m', 'WARNING: Razorpay credentials are missing. Payment orders and verification flows may fail.');
  }

  if (!config.gemini.apiKey) {
    console.warn('\x1b[33m%s\x1b[0m', 'WARNING: GEMINI_API_KEY is not defined. AI itinerary and planning searches will be disabled.');
  }
}

