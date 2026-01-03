import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const phone = '9876598765';
  const outletId = 'cbit-food-court';

  console.log(`Setting up Partner User ${phone} for ${outletId}...`);

  const user = await prisma.user.upsert({
    where: { phone },
    update: {
      role: 'PARTNER_MANAGER',
      outletId: outletId,
    },
    create: {
      phone,
      name: 'Test Partner',
      role: 'PARTNER_MANAGER',
      outletId: outletId,
      zCoins: 0,
    },
  });

  console.log('Partner User Ready:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
