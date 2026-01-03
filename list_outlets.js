import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const outlets = await prisma.outlet.findMany();
    console.log('--- All Outlets ---');
    outlets.forEach((o) => {
      console.log(`ID: ${o.id} | Name: ${o.name} | Campus: ${o.campus} | Open: ${o.isOpen}`);
    });
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
