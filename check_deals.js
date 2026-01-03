import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking for deals and combos...');

  const deals = await prisma.menuItem.findMany({
    where: {
      OR: [
        { isDeal: true },
        { category: { contains: 'Combo', mode: 'insensitive' } },
        { category: { contains: 'Deal', mode: 'insensitive' } },
      ],
    },
    include: {
      outlet: true,
    },
  });

  if (deals.length > 0) {
    console.log(`Found ${deals.length} deals/combos:`);
    deals.forEach((deal) => {
      console.log(
        `- ${deal.name} (${deal.category}) at ${deal.outlet.name}: ${deal.discount || 'No discount text'} (isDeal: ${deal.isDeal})`
      );
    });
  } else {
    console.log('No deals or combos found in the database.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
