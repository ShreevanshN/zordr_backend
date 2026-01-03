
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const phone = '9849777565';

    console.log(`Creating Partner Manager account for phone: ${phone}`);

    // Find the outlet
    const outlet = await prisma.outlet.findFirst({
        where: { contactPhone: phone }
    });

    if (!outlet) {
        console.log('❌ No outlet found with this contactPhone');
        return;
    }

    console.log(`✅ Found outlet: ${outlet.name} (${outlet.id})`);

    // Check if user already exists
    let user = await prisma.user.findUnique({
        where: { phone: phone }
    });

    if (user) {
        console.log(`⚠️  User already exists. Updating to link with outlet...`);

        user = await prisma.user.update({
            where: { phone: phone },
            data: {
                outletId: outlet.id,
                role: user.role === 'USER' ? 'PARTNER_MANAGER' : user.role
            }
        });

        console.log(`✅ User updated. Role: ${user.role}`);
    } else {
        console.log(`Creating new PARTNER_MANAGER user...`);

        const hashedPassword = await bcrypt.hash('Partner@123', 10);

        user = await prisma.user.create({
            data: {
                phone: phone,
                name: `${outlet.name} Manager`,
                role: 'PARTNER_MANAGER',
                password: hashedPassword,
                outletId: outlet.id,
                isActive: true
            }
        });

        console.log(`✅ Partner account created!`);
        console.log(`   Phone: ${user.phone}`);
        console.log(`   Default Password: Partner@123`);
        console.log(`   Role: ${user.role}`);
    }
}

main()
    .catch(e => console.error('Error:', e))
    .finally(async () => await prisma.$disconnect());
