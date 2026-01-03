
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const phone = '9849777565';
    console.log(`Checking for User with phone: ${phone}`);

    const user = await prisma.user.findUnique({
        where: { phone: phone }
    });

    if (user) {
        console.log('✅ User FOUND:', user);
    } else {
        console.log('❌ User NOT Found in User table.');
    }

    const outlet = await prisma.outlet.findFirst({
        where: { contactPhone: phone }
    });

    if (outlet) {
        console.log('✅ Outlet FOUND with this contactPhone:', outlet.name, outlet.id);
    } else {
        console.log('❌ No Outlet found with this contactPhone.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
