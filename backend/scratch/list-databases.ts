import { Client } from 'pg';

async function main() {
  const connectionString = "postgresql://neondb_owner:npg_DVjdzZ6xU5fA@ep-long-term-aorq78bp.c-2.ap-southeast-1.aws.neon.tech/postgres?sslmode=require";
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    
    // List all databases
    const dbRes = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false;");
    console.log('--- DATABASES ---');
    console.log(dbRes.rows.map(r => r.datname));
    
    // Connect specifically to neondb and check schemas
    // Wait, let's list schemas in the current database
  } catch (error) {
    console.error('Failed to list databases:', error);
  } finally {
    await client.end();
  }
}

main();
