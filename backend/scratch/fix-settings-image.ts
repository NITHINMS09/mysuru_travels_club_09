import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Fix instagram_profile_picture still pointing to dead CDN
  const result = await prisma.siteSetting.updateMany({
    where: {
      key: 'instagram_profile_picture',
      value: { contains: 'cdn.corenexis.com' }
    },
    data: {
      value: '/logo.png'
    }
  });
  console.log(`Updated instagram_profile_picture: ${result.count} records`);

  // Check for any remaining references to the dead CDN
  const remaining = await prisma.siteSetting.findMany({
    where: {
      value: { contains: 'cdn.corenexis.com' }
    }
  });
  if (remaining.length > 0) {
    console.log('Remaining CDN references:');
    remaining.forEach(r => console.log(`  ${r.key}: ${r.value}`));
  } else {
    console.log('No more dead CDN references in site settings!');
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
