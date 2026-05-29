import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const trips = await prisma.trip.findMany({ take: 1 });
    console.log('Database connected successfully. Trips found:', trips.length);
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
