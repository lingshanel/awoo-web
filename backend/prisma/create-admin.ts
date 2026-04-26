import 'dotenv/config';
import { PrismaClient, AdminRole } from '@prisma/client';
import { hashAdminPassword } from '../src/modules/admin/admin-auth';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME ?? 'admin';
  const password = process.env.ADMIN_PASSWORD;

  if (!password || password.length < 12) {
    throw new Error('ADMIN_PASSWORD must be set and at least 12 characters long.');
  }

  await prisma.adminUser.upsert({
    where: { username },
    update: {
      passwordHash: hashAdminPassword(password),
      role: AdminRole.OWNER,
      isActive: true,
    },
    create: {
      username,
      passwordHash: hashAdminPassword(password),
      role: AdminRole.OWNER,
      isActive: true,
    },
  });

  console.log(`Admin user ready: ${username}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
