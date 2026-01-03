import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const outlet = await prisma.outlet.findUnique({
    where: { id: 'kitsw-juice' },
  });

  console.log('Outlet kitsw-juice:', outlet);

  const items = await prisma.menuItem.findMany({
    where: { outletId: 'kitsw-juice' },
  });
  console.log('Items for kitsw-juice:', items.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
