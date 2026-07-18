import { PrismaClient } from '@prisma/client';

const postgresUrl = "postgresql://neondb_owner:npg_DVjdzZ6xU5fA@ep-long-term-aorq78bp.c-2.ap-southeast-1.aws.neon.tech/postgres?sslmode=require";
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: postgresUrl
    }
  }
});

async function main() {
  try {
    console.log('--- INSPECTING POSTGRES DB ---');
    
    // List tables in public schema
    const tables: any = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('Tables in public schema (postgres):', tables);

    if (tables.length > 0) {
      for (const t of tables) {
        const countRes: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::integer FROM "${t.table_name}"`);
        console.log(`Table ${t.table_name}: ${countRes[0].count} records`);
      }
    }
  } catch (error) {
    console.error('Inspection failed for postgres db:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
