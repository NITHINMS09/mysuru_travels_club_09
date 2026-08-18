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
  const admins = await mongo.admin.findMany();
  console.log('Admins found in MongoDB:', admins.map(a => ({
    id: a.id,
    email: a.email,
    name: a.name,
    role: a.role,
    passwordHash: a.passwordHash
  })));
  await mongo.$disconnect();
}

main();
