import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Updating all outlets to include slot interval settings...\n');

    const outlets = await prisma.outlet.findMany({
        select: {
            id: true,
            name: true,
            operatingHours: true
        }
    });

    let updated = 0;

    for (const outlet of outlets) {
        const hours = outlet.operatingHours || {};

        // Check if slotInterval is missing
        if (!hours.slotInterval) {
            console.log(`Updating ${outlet.name}...`);

            const updatedHours = {
                ...hours,
                slotInterval: 30, // Default to 30 minutes
                maxOrdersPerSlot: 20, // Default to 20 orders
                scheduledOrders: true
            };

            await prisma.outlet.update({
                where: { id: outlet.id },
                data: { operatingHours: updatedHours }
            });

            updated++;
            console.log(`  ✅ Added slotInterval: 30, maxOrdersPerSlot: 20`);
        } else {
            console.log(`${outlet.name}: Already has slot settings ✓`);
        }
    }

    console.log(`\n✅ Updated ${updated} outlets`);
    console.log('Partners can now change these in Settings > Business Hours');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
