import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting database image path migration...\n');

  // 1. Update Trips
  console.log('Updating Trips...');
  
  // Kottiyoor Kerala trips
  const kottiyoorUpdate = await prisma.trip.updateMany({
    where: {
      title: {
        contains: 'KOTTIYOOR',
        mode: 'insensitive'
      }
    },
    data: {
      coverImage: '/images/trips/kottiyoor.png',
      images: '/images/trips/kottiyoor.png'
    }
  });
  console.log(`Updated ${kottiyoorUpdate.count} Kottiyoor trips.`);

  // Nethravathi trip
  const nethravathiUpdate = await prisma.trip.updateMany({
    where: {
      title: {
        contains: 'NETHRAVATHI',
        mode: 'insensitive'
      }
    },
    data: {
      coverImage: '/images/trips/nethravathi.png',
      images: '/images/trips/nethravathi.png'
    }
  });
  console.log(`Updated ${nethravathiUpdate.count} Nethravathi trips.`);

  // Tadiandamol trip
  const tadiandamolUpdate = await prisma.trip.updateMany({
    where: {
      title: {
        contains: 'TADIANDAMOL',
        mode: 'insensitive'
      }
    },
    data: {
      coverImage: '/images/trips/tadiandamol.png',
      images: '/images/trips/tadiandamol.png'
    }
  });
  console.log(`Updated ${tadiandamolUpdate.count} Tadiandamol trips.`);

  // 2. Update Crew Members
  console.log('\nUpdating Crew Members...');
  
  const crewUpdates = [
    { name: 'NIMISHA.E', image: '/images/crew/nimisha.png' },
    { name: 'SAMITH K M', image: '/images/crew/samith.png' },
    { name: 'RUTHEK M S', image: '/images/crew/ruthek.png' },
    { name: 'NITHIN.M.S', image: '/images/crew/nithin.png' }
  ];

  for (const c of crewUpdates) {
    const updateRes = await prisma.crewMember.updateMany({
      where: {
        name: {
          contains: c.name.split('.')[0], // support fuzzy matching e.g. NIMISHA vs NIMISHA.E
          mode: 'insensitive'
        }
      },
      data: {
        image: c.image
      }
    });
    console.log(`Updated crew member ${c.name}: ${updateRes.count} records.`);
  }

  // 3. Update Vote Destinations (give Nethravathi trek its mountain image!)
  console.log('\nUpdating Vote Destinations...');
  const voteUpdate = await prisma.voteDestination.updateMany({
    where: {
      name: {
        contains: 'NETHRAVATHI',
        mode: 'insensitive'
      }
    },
    data: {
      imageUrl: '/images/trips/nethravathi.png'
    }
  });
  console.log(`Updated ${voteUpdate.count} Vote Destinations.`);

  console.log('\n✅ Database migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
