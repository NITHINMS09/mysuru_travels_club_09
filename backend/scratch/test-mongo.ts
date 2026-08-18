import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';

const mongo = new PrismaClient({
  datasources: {
    db: {
      url: process.env.MONGODB_URI
    }
  }
});

async function main() {
  console.log('Testing Node.js Prisma connection to MongoDB...');
  try {
    const count = await mongo.user.count();
    console.log('✅ Connection SUCCESS! User count:', count);
  } catch (err: any) {
    console.error('❌ Connection FAILED:', err.message);
  } finally {
    await mongo.$disconnect();
  }
}

main();
