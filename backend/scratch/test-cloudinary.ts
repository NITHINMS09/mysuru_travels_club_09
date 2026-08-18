import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function main() {
  console.log('Testing Cloudinary config...');
  console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Present' : 'Missing');
  console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Present' : 'Missing');

  try {
    const res = await cloudinary.api.ping();
    console.log('✅ Cloudinary Connection Ping: SUCCESS', res);
  } catch (err: any) {
    console.error('❌ Cloudinary Connection Ping: FAILED', err.message);
  }
}

main();
