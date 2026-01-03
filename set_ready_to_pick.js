import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Update items to be Ready to Pick...');

    // 1. Get all items
    const items = await prisma.menuItem.findMany();

    if (items.length === 0) {
        console.log('No items found.');
        return;
    }

    // 2. Pick 5 random items
    const shuffled = items.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);

    // 3. Update them
    for (const item of selected) {
        await prisma.menuItem.update({
            where: { id: item.id },
            data: { isReadyToPick: true },
        });
        console.log(`✅ Updated: ${item.name} -> Ready to Pick`);
    }

    console.log('Done!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
