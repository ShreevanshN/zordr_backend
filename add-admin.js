import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function addSuperAdmin() {
  try {
    console.log('🔧 Creating Super Admin user...\n');

    // Hash the password
    const password = 'Admin@123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@zordr.com' },
    });

    if (existingUser) {
      console.log('⚠️  Super Admin user already exists!');
      console.log('📧 Email:', existingUser.email);
      console.log('📱 Phone:', existingUser.phone);
      console.log('👤 Role:', existingUser.role);
      return;
    }

    // Create super admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@zordr.com',
        phone: '9999999999',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        password: hashedPassword,
        isActive: true,
      },
    });

    console.log('✅ Super Admin user created successfully!\n');
    console.log('📧 Email: admin@zordr.com');
    console.log('🔑 Password: Admin@123');
    console.log('📱 Phone: 9999999999');
    console.log('👤 Role: SUPER_ADMIN');
    console.log('🆔 User ID:', admin.id);
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSuperAdmin();
