import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check ALL trip images
  const trips = await prisma.trip.findMany({
    select: { id: true, title: true, coverImage: true, images: true }
  });
  console.log('=== TRIPS ===');
  for (const t of trips) {
    console.log(JSON.stringify({ id: t.id, title: t.title, coverImage: t.coverImage, images: t.images }));
  }

  // Check ALL crew member images
  const crew = await prisma.crewMember.findMany({
    select: { id: true, name: true, image: true }
  });
  console.log('\n=== CREW MEMBERS ===');
  for (const c of crew) {
    console.log(JSON.stringify({ id: c.id, name: c.name, image: c.image }));
  }

  // Check vote destination images
  const votes = await prisma.voteDestination.findMany({
    select: { id: true, name: true, imageUrl: true }
  });
  console.log('\n=== VOTE DESTINATIONS ===');
  for (const v of votes) {
    console.log(JSON.stringify({ id: v.id, name: v.name, imageUrl: v.imageUrl }));
  }

  // Check site settings for any image URLs
  const settings = await prisma.siteSetting.findMany({
    where: {
      OR: [
        { value: { contains: 'http' } },
        { value: { contains: '/images' } },
        { value: { contains: '.png' } },
        { value: { contains: '.jpg' } },
        { value: { contains: '.jpeg' } },
      ]
    },
    select: { key: true, value: true }
  });
  console.log('\n=== SITE SETTINGS WITH IMAGE URLs ===');
  for (const s of settings) {
    console.log(JSON.stringify(s));
  }

  // Check marketplace listings for images
  const marketplace = await prisma.marketplaceListing.findMany({
    select: { id: true, title: true, image: true, gallery: true }
  });
  console.log('\n=== MARKETPLACE LISTINGS ===');
  for (const m of marketplace) {
    console.log(JSON.stringify({ id: m.id, title: m.title, image: m.image, gallery: m.gallery }));
  }

  // Check blogs for images
  const blogs = await prisma.blog.findMany({
    select: { id: true, title: true, coverImage: true }
  });
  console.log('\n=== BLOGS ===');
  for (const b of blogs) {
    console.log(JSON.stringify({ id: b.id, title: b.title, coverImage: b.coverImage }));
  }

  // Check update videos for thumbnails
  const updates = await prisma.updateVideo.findMany({
    select: { id: true, title: true, thumbnailUrl: true, videoUrl: true }
  });
  console.log('\n=== UPDATE VIDEOS ===');
  for (const u of updates) {
    console.log(JSON.stringify({ id: u.id, title: u.title, thumbnailUrl: u.thumbnailUrl, videoUrl: u.videoUrl }));
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
