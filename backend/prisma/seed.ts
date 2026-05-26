import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Clearing existing data...\n');
  
  // Order matters for deletion (foreign keys)
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.review.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.blog.deleteMany();
  await prisma.voteComment.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.voteDestination.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.admin.deleteMany();

  console.log('🌱 Seeding fresh Admin account...\n');

  const adminHash = await bcrypt.hash('admin123456', 12);
  await prisma.admin.create({
    data: {
      email: 'admin@tripnova.com',
      passwordHash: adminHash,
      name: 'TripNova Admin',
      role: 'SUPER_ADMIN',
    },
  });

  console.log('🗳️ Adding default vote destinations...\n');
  await prisma.voteDestination.createMany({
    data: [
      { name: 'Lofoten Islands', description: 'Dramatic landscapes, majestic mountains, and deep blue fjords in Norway.', suggestedBy: 'Alice', voteCount: 45 },
      { name: 'Cappadocia', description: 'Famous for its fairy chimneys, ancient cave dwellings, and hot air balloons in Turkey.', suggestedBy: 'Bob', voteCount: 38 },
      { name: 'Patagonia', description: 'Breathtaking glaciers and rugged peaks at the southern tip of South America.', suggestedBy: 'Charlie', voteCount: 52 }
    ]
  });

  console.log('✅ Admin created: admin@tripnova.com');
  console.log('✅ Vote destinations added');
  console.log('✅ Database is now clean and ready for your own data!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
