import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { DEFAULT_BOARDS } from '../src/modules/boards/boards.constants';

const prisma = new PrismaClient();

async function main() {
  for (const [index, board] of DEFAULT_BOARDS.entries()) {
    await prisma.board.upsert({
      where: { slug: board.slug },
      update: {
        name: board.name,
        description: board.description,
        sortOrder: index,
        isActive: true,
      },
      create: {
        slug: board.slug,
        name: board.name,
        description: board.description,
        sortOrder: index,
        isActive: true,
      },
    });
  }
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
