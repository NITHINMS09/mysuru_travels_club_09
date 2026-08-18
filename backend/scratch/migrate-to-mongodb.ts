import { PrismaClient as PostgresClient } from '../prisma/postgres-client';
import { PrismaClient as MongoClient } from '@prisma/client';

const pg = new PostgresClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const mongo = new MongoClient({
  datasources: {
    db: {
      url: process.env.MONGODB_URI
    }
  }
});

async function migrateTable<T extends { id: string }>(
  tableName: string,
  pgQuery: () => Promise<T[]>,
  mongoModel: any
) {
  console.log(`\n--------------------------------------------`);
  console.log(`Starting migration for table: ${tableName}`);
  console.log(`--------------------------------------------`);

  let successCount = 0;
  let failCount = 0;
  const errors: string[] = [];

  try {
    const pgRecords = await pgQuery();
    console.log(`Found ${pgRecords.length} records in Neon PostgreSQL`);

    // Process in batches of 50 for performance and rate limit safety
    const batchSize = 50;
    for (let i = 0; i < pgRecords.length; i += batchSize) {
      const batch = pgRecords.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (record) => {
          try {
            const { id, ...updateData } = record;
            await mongoModel.upsert({
              where: { id },
              update: updateData,
              create: record
            });
            successCount++;
          } catch (err: any) {
            failCount++;
            errors.push(`ID ${record.id}: ${err.message}`);
          }
        })
      );
    }

    const mongoCount = await mongoModel.count();
    console.log(`Migration result for ${tableName}:`);
    console.log(`  - PostgreSQL count: ${pgRecords.length}`);
    console.log(`  - MongoDB count: ${mongoCount}`);
    console.log(`  - Successfully written/updated: ${successCount}`);
    console.log(`  - Failed: ${failCount}`);

    return {
      table: tableName,
      pgCount: pgRecords.length,
      mongoCount,
      successCount,
      failCount,
      errors
    };
  } catch (err: any) {
    console.error(`Fatal error migrating ${tableName}:`, err.message);
    return {
      table: tableName,
      pgCount: -1,
      mongoCount: -1,
      successCount: 0,
      failCount: 0,
      errors: [err.message]
    };
  }
}

async function main() {
  console.log('Starting DB migration from Neon PostgreSQL to MongoDB Atlas...');
  console.log('PostgreSQL URL:', process.env.DATABASE_URL ? 'Configured' : 'Missing');
  console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Configured' : 'Missing');

  if (!process.env.DATABASE_URL || !process.env.MONGODB_URI) {
    console.error('Missing DATABASE_URL or MONGODB_URI. Aborting.');
    process.exit(1);
  }

  const reports: any[] = [];

  // Migrate in topological (dependency) order
  reports.push(await migrateTable('admin', () => pg.admin.findMany(), mongo.admin));
  reports.push(await migrateTable('user', () => pg.user.findMany(), mongo.user));
  reports.push(await migrateTable('trip', () => pg.trip.findMany(), mongo.trip));
  reports.push(await migrateTable('blog', () => pg.blog.findMany(), mongo.blog));
  reports.push(await migrateTable('voteDestination', () => pg.voteDestination.findMany(), mongo.voteDestination));
  reports.push(await migrateTable('crewMember', () => pg.crewMember.findMany(), mongo.crewMember));
  reports.push(await migrateTable('siteSetting', () => pg.siteSetting.findMany(), mongo.siteSetting));
  reports.push(await migrateTable('marketplaceListing', () => pg.marketplaceListing.findMany(), mongo.marketplaceListing));
  reports.push(await migrateTable('visitor', () => pg.visitor.findMany(), mongo.visitor));
  reports.push(await migrateTable('updateVideo', () => pg.updateVideo.findMany(), mongo.updateVideo));
  reports.push(await migrateTable('whatsAppSettings', () => pg.whatsAppSettings.findMany(), mongo.whatsAppSettings));
  reports.push(await migrateTable('adminLog', () => pg.adminLog.findMany(), mongo.adminLog));
  reports.push(await migrateTable('instagramMedia', () => pg.instagramMedia.findMany(), mongo.instagramMedia));
  reports.push(await migrateTable('socialUpdate', () => pg.socialUpdate.findMany(), mongo.socialUpdate));
  reports.push(await migrateTable('notification', () => pg.notification.findMany(), mongo.notification));
  
  // Dependent models
  reports.push(await migrateTable('booking', () => pg.booking.findMany(), mongo.booking));
  reports.push(await migrateTable('payment', () => pg.payment.findMany(), mongo.payment));
  reports.push(await migrateTable('paymentHistory', () => pg.paymentHistory.findMany(), mongo.paymentHistory));
  reports.push(await migrateTable('review', () => pg.review.findMany(), mongo.review));
  reports.push(await migrateTable('chatMessage', () => pg.chatMessage.findMany(), mongo.chatMessage));
  reports.push(await migrateTable('vote', () => pg.vote.findMany(), mongo.vote));
  reports.push(await migrateTable('voteComment', () => pg.voteComment.findMany(), mongo.voteComment));
  reports.push(await migrateTable('visitorSession', () => pg.visitorSession.findMany(), mongo.visitorSession));
  reports.push(await migrateTable('pageView', () => pg.pageView.findMany(), mongo.pageView));
  reports.push(await migrateTable('notificationLog', () => pg.notificationLog.findMany(), mongo.notificationLog));

  console.log(`\n============================================`);
  console.log(`MIGRATION COMPLETE SUMMARY REPORT`);
  console.log(`============================================`);
  
  const summaryTable = reports.map(r => ({
    Table: r.table,
    PostgresCount: r.pgCount,
    MongoDBCount: r.mongoCount,
    Migrated: r.successCount,
    Failed: r.failCount,
    Errors: r.errors.length ? r.errors.length : 'None'
  }));
  
  console.table(summaryTable);

  // Detailed error logging
  const tablesWithErrors = reports.filter(r => r.failCount > 0);
  if (tablesWithErrors.length > 0) {
    console.log(`\nDetailed errors per table:`);
    for (const report of tablesWithErrors) {
      console.log(`\nTable ${report.table} errors (first 10 shown):`);
      report.errors.slice(0, 10).forEach((e: string) => console.log(`  - ${e}`));
    }
  }

  await pg.$disconnect();
  await mongo.$disconnect();
}

main();
