import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up database...');
  // Delete in order of dependencies
  await prisma.notification.deleteMany({});
  await prisma.favorite.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.supportTicket.deleteMany({});
  await prisma.settlement.deleteMany({});
  await prisma.offer.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.menuItem.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.outlet.deleteMany({});
  console.log('✨ Database cleaned!');

  console.log('🌱 Starting database seed...');

  // --- 1. Create Outlets ---
  console.log('Creating outlets...');

  const mainCanteen = await prisma.outlet.upsert({
    where: { id: 'kitsw-main-canteen' },
    update: {
      name: 'Main Canteen',
      campus: 'KITSW',
      image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1000',
      location: 'Academic Block Ground Floor',
      contactPhone: '+91 9876543210',
      isOpen: true,
      rating: 4.5,
      prepTime: '15 mins',
    },
    create: {
      id: 'kitsw-main-canteen',
      name: 'Main Canteen',
      campus: 'KITSW',
      image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1000',
      location: 'Academic Block Ground Floor',
      contactPhone: '+91 9876543210',
      isOpen: true,
      rating: 4.5,
      prepTime: '15 mins',
    },
  });

  const smallCanteen = await prisma.outlet.upsert({
    where: { id: 'kitsw-small-canteen' },
    update: {
      name: 'Small Canteen',
      campus: 'KITSW',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1000',
      location: 'Library Building',
      contactPhone: '+91 9876543211',
      isOpen: true,
      rating: 4.8,
      prepTime: '10 mins',
    },
    create: {
      id: 'kitsw-small-canteen',
      name: 'Small Canteen',
      campus: 'KITSW',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1000',
      location: 'Library Building',
      contactPhone: '+91 9876543211',
      isOpen: true,
      rating: 4.8,
      prepTime: '10 mins',
    },
  });

  const sruMainCanteen = await prisma.outlet.upsert({
    where: { id: 'sru-main-canteen' },
    update: {
      name: 'SRU Main Canteen',
      campus: 'SRU',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000',
      location: 'Main Building Ground Floor',
      contactPhone: '+91 9876543220',
      isOpen: true,
      rating: 4.6,
      prepTime: '12 mins',
    },
    create: {
      id: 'sru-main-canteen',
      name: 'SRU Main Canteen',
      campus: 'SRU',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000',
      location: 'Main Building Ground Floor',
      contactPhone: '+91 9876543220',
      isOpen: true,
      rating: 4.6,
      prepTime: '12 mins',
    },
  });

  const sruCafeteria = await prisma.outlet.upsert({
    where: { id: 'sru-cafeteria' },
    update: {
      name: 'SRU Cafeteria',
      campus: 'SRU',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000',
      location: 'Student Center',
      contactPhone: '+91 9876543221',
      isOpen: true,
      rating: 4.7,
      prepTime: '8 mins',
    },
    create: {
      id: 'sru-cafeteria',
      name: 'SRU Cafeteria',
      campus: 'SRU',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000',
      location: 'Student Center',
      contactPhone: '+91 9876543221',
      isOpen: true,
      rating: 4.7,
      prepTime: '8 mins',
    },
  });

  // CBIT Campus
  const cbitMainCanteen = await prisma.outlet.upsert({
    where: { id: 'cbit-main-canteen' },
    update: {
      name: 'CBIT Main Canteen',
      campus: 'CBIT',
      image: 'https://images.unsplash.com/photo-1567521463850-000cdd28e8c9?q=80&w=1000',
      location: 'Main Block Ground Floor',
      contactPhone: '+91 9876543230',
      isOpen: true,
      rating: 4.5,
      prepTime: '10 mins',
    },
    create: {
      id: 'cbit-main-canteen',
      name: 'CBIT Main Canteen',
      campus: 'CBIT',
      image: 'https://images.unsplash.com/photo-1567521463850-000cdd28e8c9?q=80&w=1000',
      location: 'Main Block Ground Floor',
      contactPhone: '+91 9876543230',
      isOpen: true,
      rating: 4.5,
      prepTime: '10 mins',
    },
  });

  const cbitFoodCourt = await prisma.outlet.upsert({
    where: { id: 'cbit-food-court' },
    update: {
      name: 'CBIT Food Court',
      campus: 'CBIT',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000',
      location: 'Engineering Block',
      contactPhone: '+91 9876543231',
      isOpen: true,
      rating: 4.8,
      prepTime: '15 mins',
    },
    create: {
      id: 'cbit-food-court',
      name: 'CBIT Food Court',
      campus: 'CBIT',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000',
      location: 'Engineering Block',
      contactPhone: '+91 9876543231',
      isOpen: true,
      rating: 4.8,
      prepTime: '15 mins',
    },
  });

  // JNTUH Campus
  const jntuhMainCanteen = await prisma.outlet.upsert({
    where: { id: 'jntuh-main-canteen' },
    update: {
      name: 'JNTUH Main Canteen',
      campus: 'JNTUH',
      image: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?q=80&w=1000',
      location: 'Admin Block',
      contactPhone: '+91 9876543240',
      isOpen: true,
      rating: 4.4,
      prepTime: '12 mins',
    },
    create: {
      id: 'jntuh-main-canteen',
      name: 'JNTUH Main Canteen',
      campus: 'JNTUH',
      image: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?q=80&w=1000',
      location: 'Admin Block',
      contactPhone: '+91 9876543240',
      isOpen: true,
      rating: 4.4,
      prepTime: '12 mins',
    },
  });

  const jntuhCafeteria = await prisma.outlet.upsert({
    where: { id: 'jntuh-cafeteria' },
    update: {
      name: 'JNTUH Student Cafeteria',
      campus: 'JNTUH',
      image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?q=80&w=1000',
      location: 'Student Activity Center',
      contactPhone: '+91 9876543241',
      isOpen: true,
      rating: 4.6,
      prepTime: '10 mins',
    },
    create: {
      id: 'jntuh-cafeteria',
      name: 'JNTUH Student Cafeteria',
      campus: 'JNTUH',
      image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?q=80&w=1000',
      location: 'Student Activity Center',
      contactPhone: '+91 9876543241',
      isOpen: true,
      rating: 4.6,
      prepTime: '10 mins',
    },
  });

  // VNRYUP Campus
  const vnryupMainCanteen = await prisma.outlet.upsert({
    where: { id: 'vnryup-main-canteen' },
    update: {
      name: 'VNR Main Canteen',
      campus: 'VNRYUP',
      image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=1000',
      location: 'Central Block',
      contactPhone: '+91 9876543250',
      isOpen: true,
      rating: 4.7,
      prepTime: '8 mins',
    },
    create: {
      id: 'vnryup-main-canteen',
      name: 'VNR Main Canteen',
      campus: 'VNRYUP',
      image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=1000',
      location: 'Central Block',
      contactPhone: '+91 9876543250',
      isOpen: true,
      rating: 4.7,
      prepTime: '8 mins',
    },
  });

  const vnryupCafe = await prisma.outlet.upsert({
    where: { id: 'vnryup-cafe' },
    update: {
      name: 'VNR Campus Cafe',
      campus: 'VNRYUP',
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1000',
      location: 'Library Building',
      contactPhone: '+91 9876543251',
      isOpen: true,
      rating: 4.9,
      prepTime: '7 mins',
    },
    create: {
      id: 'vnryup-cafe',
      name: 'VNR Campus Cafe',
      campus: 'VNRYUP',
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1000',
      location: 'Library Building',
      contactPhone: '+91 9876543251',
      isOpen: true,
      rating: 4.9,
      prepTime: '7 mins',
    },
  });

  // --- 2. Create Menu Items ---
  console.log('Creating menu items...');

  // Helper to create items for both canteens
  const commonItems = [
    {
      name: 'Samosa',
      description: 'Crispy potato stuffed pastry',
      price: 15,
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=1000',
      category: 'Snacks',
      dietary: 'Veg',
      isVeg: true,
    },
    {
      name: 'Coca Cola',
      description: 'Chilled soft drink 250ml',
      price: 20,
      image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=1000',
      category: 'Drinks',
      dietary: 'Veg',
      isVeg: true,
    },
    {
      name: 'Sprite',
      description: 'Lemon lime flavored soft drink',
      price: 20,
      image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?q=80&w=1000',
      category: 'Drinks',
      dietary: 'Veg',
      isVeg: true,
    },
    {
      name: 'Oreo Biscuits',
      description: 'Creamy chocolate biscuits pack',
      price: 30,
      image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=1000',
      category: 'Snacks',
      dietary: 'Veg',
      isVeg: true,
    },
    {
      name: 'Dairy Milk Silk',
      description: 'Smooth chocolate bar',
      price: 80,
      image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?q=80&w=1000',
      category: 'Snacks',
      dietary: 'Veg',
      isVeg: true,
    },
    {
      name: 'Vanilla Ice Cream',
      description: 'Classic vanilla scoop',
      price: 40,
      image: 'https://images.unsplash.com/photo-1576506295286-5cda18df43e7?q=80&w=1000',
      category: 'Dessert',
      dietary: 'Veg',
      isVeg: true,
    },
  ];

  const mainCanteenItems = [
    ...commonItems,
    {
      name: 'Masala Dosa',
      description: 'Crispy dosa with potato filling and chutney',
      price: 50,
      image: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?q=80&w=1000',
      category: 'Tiffins',
      dietary: 'Veg',
      isVeg: true,
    },
    {
      name: 'Idli Sambar',
      description: 'Steamed rice cakes with lentil soup',
      price: 40,
      image: 'https://images.unsplash.com/photo-1589301760576-416ccd542151?q=80&w=1000',
      category: 'Tiffins',
      dietary: 'Veg',
      isVeg: true,
    },
    {
      name: 'Veg Noodles',
      description: 'Stir fried noodles with vegetables',
      price: 80,
      image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?q=80&w=1000',
      category: 'Fast Food',
      dietary: 'Veg',
      isVeg: true,
    },
    {
      name: 'Chicken Manchurian',
      description: 'Spicy indo-chinese chicken starter',
      price: 120,
      image: 'https://images.unsplash.com/photo-1626804475297-411fdf78a427?q=80&w=1000',
      category: 'Fast Food',
      dietary: 'Non-Veg',
      isVeg: false,
    },
    {
      name: 'Chicken Biryani',
      description: 'Aromatic basmati rice with spiced chicken',
      price: 180,
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1000',
      category: 'Restaurant',
      dietary: 'Non-Veg',
      isVeg: false,
    },
    {
      name: 'Veg Thali',
      description: 'Complete meal with rice, roti, dal, curry',
      price: 120,
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=1000',
      category: 'Restaurant',
      dietary: 'Veg',
      isVeg: true,
    },
    {
      name: 'Masala Chai',
      description: 'Hot spiced indian tea',
      price: 15,
      image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=1000',
      category: 'Drinks',
      dietary: 'Veg',
      isVeg: true,
    },
    {
      name: 'Filter Coffee',
      description: 'Strong south indian coffee',
      price: 20,
      image: 'https://images.unsplash.com/photo-1517701604599-bb29b5dd7359?q=80&w=1000',
      category: 'Drinks',
      dietary: 'Veg',
      isVeg: true,
    },
  ];

  const smallCanteenItems = [
    ...commonItems,
    {
      name: 'Egg Puff',
      description: 'Flaky pastry with spicy egg filling',
      price: 25,
      image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=1000',
      category: 'Bakery',
      dietary: 'Non-Veg',
      isVeg: false,
    },
    {
      name: 'Veg Puff',
      description: 'Flaky pastry with mixed veg filling',
      price: 20,
      image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=1000',
      category: 'Bakery',
      dietary: 'Veg',
      isVeg: true,
    },
    {
      name: 'Chocolate Pastry',
      description: 'Rich chocolate layered cake slice',
      price: 45,
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1000',
      category: 'Bakery',
      dietary: 'Veg',
      isVeg: true,
    },
    {
      name: 'Chicken Burger',
      description: 'Classic chicken burger with mayo',
      price: 90,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000',
      category: 'Fast Food',
      dietary: 'Non-Veg',
      isVeg: false,
    },
  ];

  // Insert Main Canteen Items
  for (const item of mainCanteenItems) {
    await prisma.menuItem.create({
      data: {
        ...item,
        outletId: 'kitsw-main-canteen',
        isAvailable: true,
      },
    });
  }

  // Insert Small Canteen Items
  for (const item of smallCanteenItems) {
    await prisma.menuItem.create({
      data: {
        ...item,
        outletId: 'kitsw-small-canteen',
        isAvailable: true,
      },
    });
  }

  // SRU Menu Items
  const sruMainItems = [
    ...commonItems,
    {
      name: 'Paneer Butter Masala',
      description: 'Rich creamy cottage cheese curry',
      price: 140,
      image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=1000',
      category: 'Restaurant',
      dietary: 'Veg',
      isVeg: true,
    },
    {
      name: 'Chicken Tikka',
      description: 'Grilled marinated chicken pieces',
      price: 160,
      image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=1000',
      category: 'Restaurant',
      dietary: 'Non-Veg',
      isVeg: false,
    },
    {
      name: 'Veg Fried Rice',
      description: 'Stir fried rice with mixed vegetables',
      price: 90,
      image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=1000',
      category: 'Fast Food',
      dietary: 'Veg',
      isVeg: true,
    },
  ];

  const sruCafeteriaItems = [
    ...commonItems,
    {
      name: 'Club Sandwich',
      description: 'Triple decker sandwich with chicken & veggies',
      price: 110,
      image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=1000',
      category: 'Fast Food',
      dietary: 'Non-Veg',
      isVeg: false,
    },
    {
      name: 'Cappuccino',
      description: 'Creamy espresso with steamed milk',
      price: 60,
      image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=1000',
      category: 'Drinks',
      dietary: 'Veg',
      isVeg: true,
    },
    {
      name: 'Brownie',
      description: 'Warm chocolate brownie with ice cream',
      price: 70,
      image: 'https://images.unsplash.com/photo-1607920591413-4ec007e70023?q=80&w=1000',
      category: 'Dessert',
      dietary: 'Veg',
      isVeg: true,
    },
  ];

  // Insert SRU Main Canteen Items
  for (const item of sruMainItems) {
    await prisma.menuItem.create({
      data: {
        ...item,
        outletId: 'sru-main-canteen',
        isAvailable: true,
      },
    });
  }

  // Insert SRU Cafeteria Items
  for (const item of sruCafeteriaItems) {
    await prisma.menuItem.create({
      data: {
        ...item,
        outletId: 'sru-cafeteria',
        isAvailable: true,
      },
    });
  }

  // CBIT Menu Items
  const cbitMainItems = [
    ...commonItems,
    {
      name: 'Butter Naan',
      description: 'Soft tandoori bread with butter',
      price: 30,
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=1000',
      category: 'Restaurant',
      dietary: 'Veg',
      isVeg: true,
    },
    {
      name: 'Paneer Tikka',
      description: 'Grilled cottage cheese with spices',
      price: 150,
      image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?q=80&w=1000',
      category: 'Restaurant',
      dietary: 'Veg',
      isVeg: true,
    },
    {
      name: 'Mutton Biryani',
      description: 'Aromatic rice with tender mutton',
      price: 220,
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1000',
      category: 'Restaurant',
      dietary: 'Non-Veg',
      isVeg: false,
    },
  ];

  const cbitFoodCourtItems = [
    ...commonItems,
    {
      name: 'Veg Burger',
      description: 'Crispy patty burger with veggies',
      price: 70,
      image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=1000',
      category: 'Fast Food',
      dietary: 'Veg',
      isVeg: true,
    },
    {
      name: 'French Fries',
      description: 'Crispy golden fries',
      price: 50,
      image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=1000',
      category: 'Snacks',
      dietary: 'Veg',
      isVeg: true,
    },
    {
      name: 'Pizza Slice',
      description: 'Cheese loaded pizza slice',
      price: 60,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000',
      category: 'Fast Food',
      dietary: 'Veg',
      isVeg: true,
    },
  ];

  // JNTUH Menu Items
  const jntuhMainItems = [
    ...commonItems,
    {
      name: 'Chole Bhature',
      description: 'Spicy chickpeas with fried bread',
      price: 80,
      image: 'https://images.unsplash.com/photo-1626132647523-66f3c5d9937a?q=80&w=1000',
      category: 'Tiffins',
      dietary: 'Veg',
      isVeg: true,
    },
    {
      name: 'Dal Tadka',
      description: 'Yellow lentils with spices',
      price: 100,
      image: 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?q=80&w=1000',
      category: 'Restaurant',
      dietary: 'Veg',
      isVeg: true,
    },
    {
      name: 'Chicken Curry',
      description: 'Spicy chicken gravy',
      price: 160,
      image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?q=80&w=1000',
      category: 'Restaurant',
      dietary: 'Non-Veg',
      isVeg: false,
    },
  ];

  const jntuhCafeteriaItems = [
    ...commonItems,
    {
      name: 'Sandwich',
      description: 'Grilled veg sandwich',
      price: 60,
      image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=1000',
      category: 'Snacks',
      dietary: 'Veg',
      isVeg: true,
    },
    {
      name: 'Cold Coffee',
      description: 'Chilled coffee with ice cream',
      price: 70,
      image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?q=80&w=1000',
      category: 'Drinks',
      dietary: 'Veg',
      isVeg: true,
    },
  ];

  // VNRYUP Menu Items
  const vnryupMainItems = [
    ...commonItems,
    {
      name: 'Pav Bhaji',
      description: 'Mixed veg curry with bread',
      price: 90,
      image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?q=80&w=1000',
      category: 'Fast Food',
      dietary: 'Veg',
      isVeg: true,
    },
    {
      name: 'Fried Rice',
      description: 'Stir fried rice with veggies',
      price: 100,
      image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=1000',
      category: 'Fast Food',
      dietary: 'Veg',
      isVeg: true,
    },
    {
      name: 'Fish Fry',
      description: 'Crispy fried fish',
      price: 180,
      image: 'https://images.unsplash.com/photo-1580959375944-0a7e8c6dc0d4?q=80&w=1000',
      category: 'Restaurant',
      dietary: 'Non-Veg',
      isVeg: false,
    },
  ];

  const vnryupCafeItems = [
    ...commonItems,
    {
      name: 'Espresso',
      description: 'Strong Italian coffee',
      price: 80,
      image: 'https://images.unsplash.com/photo-1580933073521-dc49ac0d4e6a?q=80&w=1000',
      category: 'Drinks',
      dietary: 'Veg',
      isVeg: true,
    },
    {
      name: 'Croissant',
      description: 'Buttery flaky pastry',
      price: 55,
      image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=1000',
      category: 'Bakery',
      dietary: 'Veg',
      isVeg: true,
    },
    {
      name: 'Muffin',
      description: 'Chocolate chip muffin',
      price: 45,
      image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?q=80&w=1000',
      category: 'Bakery',
      dietary: 'Veg',
      isVeg: true,
    },
  ];

  // Insert CBIT Items
  for (const item of cbitMainItems) {
    await prisma.menuItem.create({
      data: {
        ...item,
        outletId: 'cbit-main-canteen',
        isAvailable: true,
      },
    });
  }

  for (const item of cbitFoodCourtItems) {
    await prisma.menuItem.create({
      data: {
        ...item,
        outletId: 'cbit-food-court',
        isAvailable: true,
      },
    });
  }

  // Insert JNTUH Items
  for (const item of jntuhMainItems) {
    await prisma.menuItem.create({
      data: {
        ...item,
        outletId: 'jntuh-main-canteen',
        isAvailable: true,
      },
    });
  }

  for (const item of jntuhCafeteriaItems) {
    await prisma.menuItem.create({
      data: {
        ...item,
        outletId: 'jntuh-cafeteria',
        isAvailable: true,
      },
    });
  }

  // Insert VNRYUP Items
  for (const item of vnryupMainItems) {
    await prisma.menuItem.create({
      data: {
        ...item,
        outletId: 'vnryup-main-canteen',
        isAvailable: true,
      },
    });
  }

  for (const item of vnryupCafeItems) {
    await prisma.menuItem.create({
      data: {
        ...item,
        outletId: 'vnryup-cafe',
        isAvailable: true,
      },
    });
  }

  // --- 3. Create Staff Users ---
  console.log('Creating staff users...');

  const staffUsers = [
    {
      phone: '9999999901',
      name: 'Main Manager',
      email: 'main.manager@kitsw.ac.in',
      role: 'PARTNER_MANAGER',
      outletId: 'kitsw-main-canteen',
      campus: 'KITSW',
    },
    {
      phone: '9999999902',
      name: 'Small Manager',
      email: 'small.manager@kitsw.ac.in',
      role: 'PARTNER_MANAGER',
      outletId: 'kitsw-small-canteen',
      campus: 'KITSW',
    },
    {
      phone: '9999999903',
      name: 'Main Staff',
      email: 'main.staff@kitsw.ac.in',
      role: 'PARTNER_STAFF',
      outletId: 'kitsw-main-canteen',
      campus: 'KITSW',
    },
    {
      phone: '9999999904',
      name: 'Small Staff',
      email: 'small.staff@kitsw.ac.in',
      role: 'PARTNER_STAFF',
      outletId: 'kitsw-small-canteen',
      campus: 'KITSW',
    },
    {
      phone: '9999999905',
      name: 'SRU Main Manager',
      email: 'main.manager@sru.ac.in',
      role: 'PARTNER_MANAGER',
      outletId: 'sru-main-canteen',
      campus: 'SRU',
    },
    {
      phone: '9999999906',
      name: 'SRU Cafeteria Manager',
      email: 'cafeteria.manager@sru.ac.in',
      role: 'PARTNER_MANAGER',
      outletId: 'sru-cafeteria',
      campus: 'SRU',
    },
    {
      phone: '9999999907',
      name: 'SRU Main Staff',
      email: 'main.staff@sru.ac.in',
      role: 'PARTNER_STAFF',
      outletId: 'sru-main-canteen',
      campus: 'SRU',
    },
    {
      phone: '9999999908',
      name: 'SRU Cafeteria Staff',
      email: 'cafeteria.staff@sru.ac.in',
      role: 'PARTNER_STAFF',
      outletId: 'sru-cafeteria',
      campus: 'SRU',
    },
    // CBIT Campus
    {
      phone: '9999999909',
      name: 'CBIT Main Manager',
      email: 'main.manager@cbit.ac.in',
      role: 'PARTNER_MANAGER',
      outletId: 'cbit-main-canteen',
      campus: 'CBIT',
    },
    {
      phone: '9999999910',
      name: 'CBIT FC Manager',
      email: 'fc.manager@cbit.ac.in',
      role: 'PARTNER_MANAGER',
      outletId: 'cbit-food-court',
      campus: 'CBIT',
    },
    // JNTUH Campus
    {
      phone: '9999999911',
      name: 'JNTUH Main Manager',
      email: 'main.manager@jntuh.ac.in',
      role: 'PARTNER_MANAGER',
      outletId: 'jntuh-main-canteen',
      campus: 'JNTUH',
    },
    {
      phone: '9999999912',
      name: 'JNTUH Cafeteria Manager',
      email: 'cafeteria.manager@jntuh.ac.in',
      role: 'PARTNER_MANAGER',
      outletId: 'jntuh-cafeteria',
      campus: 'JNTUH',
    },
    // VNRYUP Campus
    {
      phone: '9999999913',
      name: 'VNR Main Manager',
      email: 'main.manager@vnr.ac.in',
      role: 'PARTNER_MANAGER',
      outletId: 'vnryup-main-canteen',
      campus: 'VNRYUP',
    },
    {
      phone: '9999999914',
      name: 'VNR Cafe Manager',
      email: 'cafe.manager@vnr.ac.in',
      role: 'PARTNER_MANAGER',
      outletId: 'vnryup-cafe',
      campus: 'VNRYUP',
    },
  ];

  for (const user of staffUsers) {
    await prisma.user.upsert({
      where: { phone: user.phone },
      update: user,
      create: user,
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('-----------------------------------');
  console.log('📱 Staff Login Credentials (Login via Phone):');
  console.log('');
  console.log('🏫 KITSW Campus:');
  console.log('1. Main Canteen Manager: 9999999901');
  console.log('2. Small Canteen Manager: 9999999902');
  console.log('3. Main Canteen Staff: 9999999903');
  console.log('4. Small Canteen Staff: 9999999904');
  console.log('');
  console.log('🏫 SRU Campus:');
  console.log('5. Main Canteen Manager: 9999999905');
  console.log('6. Cafeteria Manager: 9999999906');
  console.log('7. Main Canteen Staff: 9999999907');
  console.log('8. Cafeteria Staff: 9999999908');
  console.log('');
  console.log('🏫 CBIT Campus:');
  console.log('9. Main Canteen Manager: 9999999909');
  console.log('10. Food Court Manager: 9999999910');
  console.log('');
  console.log('🏫 JNTUH Campus:');
  console.log('11. Main Canteen Manager: 9999999911');
  console.log('12. Cafeteria Manager: 9999999912');
  console.log('');
  console.log('🏫 VNRYUP Campus:');
  console.log('13. Main Canteen Manager: 9999999913');
  console.log('14. Cafe Manager: 9999999914');
  console.log('-----------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
