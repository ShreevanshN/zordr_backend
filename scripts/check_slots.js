import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const outlets = await prisma.outlet.findMany({
        select: {
            name: true,
            operatingHours: true
        },
        take: 3
    });

    outlets.forEach(outlet => {
        console.log(`\n=== ${outlet.name} ===`);
        console.log('Operating Hours:', JSON.stringify(outlet.operatingHours, null, 2));

        if (outlet.operatingHours) {
            console.log(`Slot Interval: ${outlet.operatingHours.slotInterval || 'Not set (uses default 15 min)'}`);
            console.log(`Max Orders Per Slot: ${outlet.operatingHours.maxOrdersPerSlot || 'Not set (uses default 20)'}`);
        }
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
