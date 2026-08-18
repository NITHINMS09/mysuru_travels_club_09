import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import { uploadBufferToCloudinary, deleteAssetFromUrl } from '../src/utils/cloudinary';
import { v2 as cloudinary } from 'cloudinary';

// 1x1 transparent PNG pixel buffer
const pixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

async function main() {
  console.log('--- Starting Cloudinary Upload/Delete Integration Test ---');
  console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);

  let secureUrl = '';
  let publicId = '';

  try {
    // Test 1: Upload Buffer
    console.log('\nTesting uploadBufferToCloudinary...');
    const uploadResult = await uploadBufferToCloudinary(
      pixelPng,
      'image/png',
      'test-pixel-image.png',
      'profile'
    );
    console.log('✅ Upload SUCCESS!');
    console.log('   Public ID:', uploadResult.public_id);
    console.log('   Secure URL:', uploadResult.secure_url);
    console.log('   Resource Type:', uploadResult.resource_type);

    secureUrl = uploadResult.secure_url;
    publicId = uploadResult.public_id;

    if (!publicId.startsWith('tripnova/profiles/')) {
      console.warn('⚠️ Warning: Folder structure did not match "tripnova/profiles/"');
    } else {
      console.log('✅ Folder structure is correct: starts with "tripnova/profiles/"');
    }

  } catch (err: any) {
    console.error('❌ Upload FAILED:', err.message);
    process.exit(1);
  }

  try {
    // Test 2: Delete from URL
    console.log('\nTesting deleteAssetFromUrl...');
    const deleteResult = await deleteAssetFromUrl(secureUrl);
    console.log('✅ Delete SUCCESS!');
    console.log('   Result:', deleteResult);
  } catch (err: any) {
    console.error('❌ Delete FAILED:', err.message);
    process.exit(1);
  }

  console.log('\n--- Integration Test Complete ---');
}

main();
