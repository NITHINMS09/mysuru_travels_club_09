import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const mongo = new PrismaClient({
  datasources: {
    db: {
      url: process.env.MONGODB_URI
    }
  }
});

const TEST_EMAIL = '09nithinms@gmail.com';
const ORIGINAL_HASH = '$2a$10$8QkqaOQkVP9YkMDN3Wn9MO9p5ISd0lKJIWNOlY2wRLWwBmqD1z36m';
const TEST_PASSWORD = 'admin123456';

async function main() {
  const baseURL = 'http://localhost:5000/api';
  console.log('--- Starting Authenticated API Testing against MongoDB Backend ---');

  // Step 1: Set temporary test password hash for the migrated admin in MongoDB Atlas
  const tempHash = bcrypt.hashSync(TEST_PASSWORD, 10);
  console.log(`Setting temporary password hash for ${TEST_EMAIL} in MongoDB...`);
  await mongo.admin.update({
    where: { email: TEST_EMAIL },
    data: { passwordHash: tempHash }
  });

  let token = '';
  try {
    // Test 1: Health check
    const healthRes = await fetch(`${baseURL}/health`);
    const healthData = await healthRes.json();
    console.log('✅ Test 1 (Health Check): SUCCESS', healthData);

    // Test 2: Admin Login
    console.log(`Attempting login with ${TEST_EMAIL}...`);
    const loginRes = await fetch(`${baseURL}/v1/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });
    const loginData = await loginRes.json() as any;
    if (!loginRes.ok) {
      throw new Error(JSON.stringify(loginData));
    }
    console.log('✅ Test 2 (Admin Login): SUCCESS');
    console.log('   Admin info:', loginData.admin);
    token = loginData.token;

    if (token) {
      // Test 3: Dashboard Stats
      const dashRes = await fetch(`${baseURL}/v1/auth/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dashData = await dashRes.json() as any;
      if (!dashRes.ok) {
        throw new Error(JSON.stringify(dashData));
      }
      console.log('✅ Test 3 (Dashboard Stats): SUCCESS');
      console.log('   Stats summary:', dashData.stats);
      console.log('   Recent bookings count:', dashData.recentBookings?.length);

      // Test 4: Fetch Users List
      const usersRes = await fetch(`${baseURL}/v1/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usersData = await usersRes.json() as any;
      if (!usersRes.ok) {
        throw new Error(JSON.stringify(usersData));
      }
      console.log('✅ Test 4 (Users List): SUCCESS');
      console.log('   Total users returned:', usersData.users?.length);
      console.log('   Stats:', usersData.stats);
      if (usersData.users?.length > 0) {
        console.log('   Example migrated user mobile:', usersData.users[0].mobileNumber);
      }
    }
  } catch (err: any) {
    console.error('❌ API Test Failed:', err.message);
  } finally {
    // Step 2: Restore original password hash in MongoDB Atlas
    console.log(`Restoring original password hash for ${TEST_EMAIL} in MongoDB...`);
    await mongo.admin.update({
      where: { email: TEST_EMAIL },
      data: { passwordHash: ORIGINAL_HASH }
    });
    console.log('Original hash restored successfully.');
    await mongo.$disconnect();
  }
}

main();
