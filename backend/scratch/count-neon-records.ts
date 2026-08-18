import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tables = [
    'admin',
    'user',
    'trip',
    'booking',
    'payment',
    'paymentHistory',
    'review',
    'chatMessage',
    'blog',
    'voteDestination',
    'vote',
    'voteComment',
    'notification',
    'crewMember',
    'siteSetting',
    'marketplaceListing',
    'visitor',
    'visitorSession',
    'pageView',
    'notificationLog',
    'updateVideo',
    'whatsAppSettings',
    'adminLog',
    'instagramMedia',
    'socialUpdate'
  ];

  console.log('--- Record Count from Neon PostgreSQL ---');
  for (const table of tables) {
    try {
      const count = await (prisma[table as keyof typeof prisma] as any).count();
      console.log(`${table}: ${count} records`);
    } catch (err: any) {
      console.error(`Failed to count records in ${table}:`, err.message);
    }
  }

  await prisma.$disconnect();
}

main();
