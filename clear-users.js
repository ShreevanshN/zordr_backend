// Script to clear all users and their data from database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearUsers() {
  try {
    console.log('🗑️  Clearing all user data...');

    // Delete in order to respect foreign key constraints
    await prisma.favorite.deleteMany({});
    console.log('✅ Cleared favorites');

    await prisma.orderItem.deleteMany({});
    console.log('✅ Cleared order items');

    await prisma.order.deleteMany({});
    console.log('✅ Cleared orders');

    await prisma.cartItem.deleteMany({});
    console.log('✅ Cleared cart items');

    await prisma.cart.deleteMany({});
    console.log('✅ Cleared carts');

    await prisma.user.deleteMany({});
    console.log('✅ Cleared users');

    console.log('\n🎉 All user data cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearUsers();
