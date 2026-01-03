// SR University - Zordr Seed Data
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SR University seed...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.menuItem.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.outlet.deleteMany({});

  // 1. BARISTA - Manager & Outlet
  const baristaManager = await prisma.user.create({
    data: {
      phone: '9876543210',
      name: 'Rajesh Kumar',
      email: 'rajesh@barista.sruni.ac.in',
      role: 'PARTNER_MANAGER',
      zCoins: 0,
    },
  });

  const barista = await prisma.outlet.create({
    data: {
      name: 'Barista Coffee House',
      campus: 'SRUNI',
      image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb',
      location: 'SR University Main Block, Ground Floor',
      contactPhone: '9876543210',
      rating: 4.6,
      prepTime: '10-15 mins',
      operatingHours: {
        Monday: { isOpen: true, openTime: '08:00', closeTime: '20:00' },
        Tuesday: { isOpen: true, openTime: '08:00', closeTime: '20:00' },
        Wednesday: { isOpen: true, openTime: '08:00', closeTime: '20:00' },
        Thursday: { isOpen: true, openTime: '08:00', closeTime: '20:00' },
        Friday: { isOpen: true, openTime: '08:00', closeTime: '20:00' },
        Saturday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        Sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
      },
      menu: {
        create: [
          {
            name: 'Cappuccino',
            description: 'Classic Italian coffee with steamed milk',
            price: 120,
            category: 'Hot Coffee',
            image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d',
            isVeg: true,
          },
          {
            name: 'Americano',
            description: 'Espresso with hot water',
            price: 100,
            category: 'Hot Coffee',
            image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd',
            isVeg: true,
          },
          {
            name: 'Latte',
            description: 'Espresso with steamed milk and light foam',
            price: 130,
            category: 'Hot Coffee',
            image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735',
            isVeg: true,
          },
          {
            name: 'Mocha',
            description: 'Chocolate and espresso with steamed milk',
            price: 150,
            category: 'Hot Coffee',
            image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e',
            isVeg: true,
          },
          {
            name: 'Cold Coffee',
            description: 'Chilled coffee with ice and milk',
            price: 110,
            category: 'Cold Coffee',
            image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7',
            isVeg: true,
          },
          {
            name: 'Frappe',
            description: 'Blended iced coffee',
            price: 140,
            category: 'Cold Coffee',
            image: 'https://images.unsplash.com/photo-1662047102608-a6f76b7a5d15',
            isVeg: true,
          },
          {
            name: 'Espresso',
            description: 'Strong concentrated coffee shot',
            price: 80,
            category: 'Hot Coffee',
            image: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a',
            isVeg: true,
          },
          {
            name: 'Croissant',
            description: 'Buttery flaky pastry',
            price: 60,
            category: 'Bakery',
            image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a',
            isVeg: true,
          },
        ],
      },
    },
  });

  await prisma.user.update({
    where: { id: baristaManager.id },
    data: { outletId: barista.id },
  });

  // 2. FOOD COURT - Manager & Outlet
  const foodCourtManager = await prisma.user.create({
    data: {
      phone: '9876543211',
      name: 'Priya Sharma',
      email: 'priya@foodcourt.sruni.ac.in',
      role: 'PARTNER_MANAGER',
      zCoins: 0,
    },
  });

  const foodCourt = await prisma.outlet.create({
    data: {
      name: 'SR Food Court',
      campus: 'SRUNI',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
      location: 'SR University Food Court Building',
      contactPhone: '9876543211',
      rating: 4.5,
      prepTime: '20-30 mins',
      operatingHours: {
        Monday: { isOpen: true, openTime: '10:00', closeTime: '22:00' },
        Tuesday: { isOpen: true, openTime: '10:00', closeTime: '22:00' },
        Wednesday: { isOpen: true, openTime: '10:00', closeTime: '22:00' },
        Thursday: { isOpen: true, openTime: '10:00', closeTime: '22:00' },
        Friday: { isOpen: true, openTime: '10:00', closeTime: '22:00' },
        Saturday: { isOpen: true, openTime: '10:00', closeTime: '22:00' },
        Sunday: { isOpen: true, openTime: '10:00', closeTime: '21:00' },
      },
      menu: {
        create: [
          {
            name: 'Paneer Butter Masala',
            description: 'Cottage cheese in rich tomato gravy',
            price: 180,
            category: 'Main Course',
            image: 'https://images.unsplash.com/photo-1631452180539-96aca7d48617',
            isVeg: true,
          },
          {
            name: 'Dal Tadka',
            description: 'Yellow lentils tempered with spices',
            price: 120,
            category: 'Main Course',
            image: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6',
            isVeg: true,
          },
          {
            name: 'Chicken Biryani',
            description: 'Aromatic rice with tender chicken',
            price: 220,
            category: 'Rice & Biryani',
            image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8',
            isVeg: false,
          },
          {
            name: 'Veg Biryani',
            description: 'Fragrant rice with mixed vegetables',
            price: 180,
            category: 'Rice & Biryani',
            image: 'https://images.unsplash.com/photo-1642821373181-696a54913e93',
            isVeg: true,
          },
          {
            name: 'Masala Dosa',
            description: 'Crispy crepe with spiced potato filling',
            price: 80,
            category: 'South Indian',
            image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976',
            isVeg: true,
          },
          {
            name: 'Idli Sambar',
            description: 'Steamed rice cakes with lentil curry',
            price: 60,
            category: 'South Indian',
            image: 'https://images.unsplash.com/photo-1630383249896-424e482df921',
            isVeg: true,
          },
          {
            name: 'Butter Naan',
            description: 'Soft Indian bread with butter',
            price: 40,
            category: 'Breads',
            image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950',
            isVeg: true,
          },
          {
            name: 'Curd Rice',
            description: 'Rice mixed with yogurt and tempering',
            price: 70,
            category: 'Rice & Biryani',
            image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b',
            isVeg: true,
          },
          {
            name: 'Veg Fried Rice',
            description: 'Stir-fried rice with vegetables',
            price: 140,
            category: 'Rice & Biryani',
            image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b',
            isVeg: true,
          },
          {
            name: 'Chicken Fried Rice',
            description: 'Fried rice with chicken pieces',
            price: 180,
            category: 'Rice & Biryani',
            image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19',
            isVeg: false,
          },
        ],
      },
    },
  });

  await prisma.user.update({
    where: { id: foodCourtManager.id },
    data: { outletId: foodCourt.id },
  });

  // 3. BAKERY - Manager & Outlet
  const bakeryManager = await prisma.user.create({
    data: {
      phone: '9876543212',
      name: 'Amit Patel',
      email: 'amit@bakery.sruni.ac.in',
      role: 'PARTNER_MANAGER',
      zCoins: 0,
    },
  });

  const bakery = await prisma.outlet.create({
    data: {
      name: 'Sweet Treats Bakery',
      campus: 'SRUNI',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff',
      location: 'SR University Near Library',
      contactPhone: '9876543212',
      rating: 4.7,
      prepTime: '5-10 mins',
      operatingHours: {
        Monday: { isOpen: true, openTime: '07:00', closeTime: '20:00' },
        Tuesday: { isOpen: true, openTime: '07:00', closeTime: '20:00' },
        Wednesday: { isOpen: true, openTime: '07:00', closeTime: '20:00' },
        Thursday: { isOpen: true, openTime: '07:00', closeTime: '20:00' },
        Friday: { isOpen: true, openTime: '07:00', closeTime: '20:00' },
        Saturday: { isOpen: true, openTime: '08:00', closeTime: '20:00' },
        Sunday: { isOpen: true, openTime: '08:00', closeTime: '19:00' },
      },
      menu: {
        create: [
          {
            name: 'Black Forest Cake',
            description: 'Chocolate cake with cherry filling',
            price: 450,
            category: 'Cakes',
            image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587',
            isVeg: true,
          },
          {
            name: 'Red Velvet Cake',
            description: 'Soft red cake with cream cheese frosting',
            price: 480,
            category: 'Cakes',
            image: 'https://images.unsplash.com/photo-1586788680434-30d324b2d46b',
            isVeg: true,
          },
          {
            name: 'Chocolate Brownie',
            description: 'Fudgy chocolate brownie',
            price: 80,
            category: 'Desserts',
            image: 'https://images.unsplash.com/photo-1607920591413-4ec007e70023',
            isVeg: true,
          },
          {
            name: 'Veg Puff',
            description: 'Flaky pastry with vegetable filling',
            price: 30,
            category: 'Snacks',
            image: 'https://images.unsplash.com/photo-1601000938263-c1eafad2b1f8',
            isVeg: true,
          },
          {
            name: 'Samosa',
            description: 'Crispy fried pastry with spiced potato',
            price: 20,
            category: 'Snacks',
            image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950',
            isVeg: true,
          },
          {
            name: 'Sandwich',
            description: 'Grilled vegetable sandwich',
            price: 60,
            category: 'Snacks',
            image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af',
            isVeg: true,
          },
          {
            name: 'Cupcake',
            description: 'Vanilla cupcake with frosting',
            price: 50,
            category: 'Desserts',
            image: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7',
            isVeg: true,
          },
          {
            name: 'Donut',
            description: 'Sugar coated donut',
            price: 40,
            category: 'Desserts',
            image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307',
            isVeg: true,
          },
          {
            name: 'Garlic Bread',
            description: 'Toasted bread with garlic butter',
            price: 70,
            category: 'Snacks',
            image: 'https://images.unsplash.com/photo-1573140401552-388e7c460a3c',
            isVeg: true,
          },
        ],
      },
    },
  });

  await prisma.user.update({
    where: { id: bakeryManager.id },
    data: { outletId: bakery.id },
  });

  // 4. CAFE - Manager & Outlet
  const cafeManager = await prisma.user.create({
    data: {
      phone: '9876543213',
      name: 'Sneha Reddy',
      email: 'sneha@cafe.sruni.ac.in',
      role: 'PARTNER_MANAGER',
      zCoins: 0,
    },
  });

  const cafe = await prisma.outlet.create({
    data: {
      name: 'Campus Cafe',
      campus: 'SRUNI',
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
      location: 'SR University Student Center',
      contactPhone: '9876543213',
      rating: 4.4,
      prepTime: '15-20 mins',
      operatingHours: {
        Monday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
        Tuesday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
        Wednesday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
        Thursday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
        Friday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
        Saturday: { isOpen: true, openTime: '10:00', closeTime: '20:00' },
        Sunday: { isOpen: true, openTime: '10:00', closeTime: '20:00' },
      },
      menu: {
        create: [
          {
            name: 'Green Tea',
            description: 'Refreshing green tea',
            price: 60,
            category: 'Beverages',
            image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9',
            isVeg: true,
          },
          {
            name: 'Masala Tea',
            description: 'Spiced Indian tea',
            price: 30,
            category: 'Beverages',
            image: 'https://images.unsplash.com/photo-1597318170008-649f07886169',
            isVeg: true,
          },
          {
            name: 'Filter Coffee',
            description: 'South Indian style filter coffee',
            price: 40,
            category: 'Beverages',
            image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e',
            isVeg: true,
          },
          {
            name: 'Mango Smoothie',
            description: 'Fresh mango blended smoothie',
            price: 100,
            category: 'Beverages',
            image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625',
            isVeg: true,
          },
          {
            name: 'Burger',
            description: 'Veg patty burger with cheese',
            price: 120,
            category: 'Fast Food',
            image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
            isVeg: true,
          },
          {
            name: 'French Fries',
            description: 'Crispy golden fries',
            price: 80,
            category: 'Fast Food',
            image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877',
            isVeg: true,
          },
          {
            name: 'Pizza Slice',
            description: 'Cheese pizza slice',
            price: 90,
            category: 'Fast Food',
            image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
            isVeg: true,
          },
          {
            name: 'Pasta',
            description: 'White sauce pasta',
            price: 140,
            category: 'Fast Food',
            image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9',
            isVeg: true,
          },
          {
            name: 'Hot Chocolate',
            description: 'Rich hot chocolate drink',
            price: 90,
            category: 'Beverages',
            image: 'https://images.unsplash.com/photo-1517578239113-b03992dcdd25',
            isVeg: true,
          },
          {
            name: 'Iced Tea',
            description: 'Chilled lemon tea',
            price: 70,
            category: 'Beverages',
            image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc',
            isVeg: true,
          },
        ],
      },
    },
  });

  await prisma.user.update({
    where: { id: cafeManager.id },
    data: { outletId: cafe.id },
  });

  // Create sample student user
  const student = await prisma.user.create({
    data: {
      phone: '9999999999',
      name: 'Student Test User',
      email: 'student@sruni.ac.in',
      role: 'USER',
      zCoins: 500,
    },
  });

  console.log('✅ Created Outlets:');
  console.log(`   1. ${barista.name} - Manager: ${baristaManager.name} (${baristaManager.phone})`);
  console.log(
    `   2. ${foodCourt.name} - Manager: ${foodCourtManager.name} (${foodCourtManager.phone})`
  );
  console.log(`   3. ${bakery.name} - Manager: ${bakeryManager.name} (${bakeryManager.phone})`);
  console.log(`   4. ${cafe.name} - Manager: ${cafeManager.name} (${cafeManager.phone})`);
  console.log(`✅ Created Student: ${student.name} (${student.phone})`);
  console.log('🚀 SR University seed finished!');
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
