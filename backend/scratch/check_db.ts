import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function check() {
  const admins = await prisma.admin.findMany();
  console.log('Admins in DB:', admins.map(a => ({ id: a.id, email: a.email, name: a.name })));
}
check().finally(() => prisma.$disconnect());
