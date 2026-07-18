import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  console.error('\x1b[31m%s\x1b[0m', 'FATAL DATABASE ERROR: DATABASE_URL environment variable is missing.');
  console.error('Please configure DATABASE_URL in your environment or .env file before starting the application.');
  process.exit(1);
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
