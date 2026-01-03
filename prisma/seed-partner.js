import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Partner Seed...');

  // 1. Find or Create Outlet
  let outlet = await prisma.outlet.findFirst();
  if (!outlet) {
    outlet = await prisma.outlet.create({
      data: {
        name: 'Zordr Central Kitchen',
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
        location: 'Hanamkonda, Telangana',
        contactPhone: '9876543210',
        rating: 4.8,
        prepTime: '20 mins',
      },
    });
    console.log(`✅ Created Outlet: ${outlet.name}`);
  } else {
    console.log(`ℹ️ Found Outlet: ${outlet.name}`);
  }

  // 2. Create Partner Manager
  const partnerPhone = '9876543210';
  const partnerUser = await prisma.user.upsert({
    where: { phone: partnerPhone },
    update: {
      role: 'PARTNER_MANAGER',
      outletId: outlet.id,
    },
    create: {
      phone: partnerPhone,
      email: 'manager@zordr.com',
      name: 'Rajesh Kumar',
      role: 'PARTNER_MANAGER',
      outletId: outlet.id,
      zCoins: 0,
    },
  });

  console.log(`✅ Created/Updated Partner User: ${partnerUser.name} (${partnerUser.phone})`);
  console.log('🚀 Partner Seed finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
