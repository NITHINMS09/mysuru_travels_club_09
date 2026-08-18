import { PrismaClient } from '@prisma/client';

if (!process.env.MONGODB_URI) {
  console.error('\x1b[31m%s\x1b[0m', 'FATAL DATABASE ERROR: MONGODB_URI environment variable is missing.');
  console.error('Please configure MONGODB_URI in your environment or .env file before starting the application.');
  process.exit(1);
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: process.env.MONGODB_URI,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;

