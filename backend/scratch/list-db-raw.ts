import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('--- DB INFO ---');
    
    // Check current database name
    const currentDb = await prisma.$queryRaw`SELECT current_database()`;
    console.log('Current Database:', currentDb);
    
    // List databases
    const databases = await prisma.$queryRaw`SELECT datname FROM pg_database WHERE datistemplate = false`;
    console.log('All Databases:', databases);
    
    // List schemas
    const schemas = await prisma.$queryRaw`SELECT schema_name FROM information_schema.schemata`;
    console.log('All Schemas:', schemas);

    // List tables in public schema
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('All Tables in public:', tables);
  } catch (error) {
    console.error('Inspection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
