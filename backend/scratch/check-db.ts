import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const adminCount = await prisma.admin.count();
    const tripCount = await prisma.trip.count();
    const bookingCount = await prisma.booking.count();
    const blogCount = await prisma.blog.count();
    const voteDestCount = await prisma.voteDestination.count();
    const reviewCount = await prisma.review.count();
    const crewCount = await prisma.crewMember.count();
    const expenseCount = await prisma.expense?.count().catch(() => -1);
    const purchaseCount = await prisma.purchase?.count().catch(() => -1);

    console.log('--- DATABASE INSPECTION REPORT ---');
    console.log('Admin records:', adminCount);
    console.log('Trip records:', tripCount);
    console.log('Booking records:', bookingCount);
    console.log('Blog records:', blogCount);
    console.log('VoteDestination records:', voteDestCount);
    console.log('Review records:', reviewCount);
    console.log('CrewMember records:', crewCount);
    console.log('Expense records:', expenseCount);
    console.log('Purchase records:', purchaseCount);

    if (tripCount > 0) {
      const sampleTrips = await prisma.trip.findMany({ take: 3 });
      console.log('Sample Trips:', sampleTrips);
    }
    
    if (voteDestCount > 0) {
      const sampleDests = await prisma.voteDestination.findMany({ take: 3 });
      console.log('Sample Vote Destinations:', sampleDests);
    }
  } catch (error) {
    console.error('Inspection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
