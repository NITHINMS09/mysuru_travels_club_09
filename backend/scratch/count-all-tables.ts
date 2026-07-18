import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('--- COUNTING ALL TABLES IN NEONDB ---');
    const tables: any = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

    for (const t of tables) {
      try {
        const countRes: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::integer FROM "${t.table_name}"`);
        console.log(`Table ${t.table_name}: ${countRes[0].count} records`);
      } catch (e: any) {
        console.error(`Failed to count ${t.table_name}:`, e.message);
      }
    }
  } catch (error) {
    console.error('Inspection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
