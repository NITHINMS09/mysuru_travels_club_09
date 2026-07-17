import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- TRIPS ---');
  const trips = await prisma.trip.findMany();
  for (const t of trips) {
    console.log(`Trip ID: ${t.id}`);
    console.log(`Title: ${t.title}`);
    console.log(`CoverImage: ${t.coverImage}`);
    console.log(`Images: ${t.images}`);
    console.log('---');
  }

  console.log('\n--- CREW MEMBERS ---');
  const crew = await prisma.crewMember.findMany();
  for (const c of crew) {
    console.log(`Crew ID: ${c.id}`);
    console.log(`Name: ${c.name}`);
    console.log(`Image: ${c.image}`);
    console.log('---');
  }

  console.log('\n--- VOTE DESTINATIONS ---');
  const votes = await prisma.voteDestination.findMany();
  for (const v of votes) {
    console.log(`Vote ID: ${v.id}`);
    console.log(`Name: ${v.name}`);
    console.log(`ImageUrl: ${v.imageUrl}`);
    console.log('---');
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
