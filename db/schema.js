import { query } from './database.js';

// Initialize database tables
export const initDatabase = async () => {
  try {
    console.log('🔧 Initializing database schema...');

    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        outlet VARCHAR(255),
        password_hash VARCHAR(255),
        loyalty_points INTEGER DEFAULT 0,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Menu items table
    await query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        image_url TEXT,
        rating DECIMAL(3,2) DEFAULT 4.0,
        is_popular BOOLEAN DEFAULT FALSE,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Carts table
    await query(`
      CREATE TABLE IF NOT EXISTS carts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Cart items table
    await query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        cart_id INTEGER REFERENCES carts(id) ON DELETE CASCADE,
        menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(cart_id, menu_item_id)
      )
    `);

    // Orders table
    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        outlet_id VARCHAR(100) DEFAULT 'main',
        subtotal DECIMAL(10,2) NOT NULL,
        discount DECIMAL(10,2) DEFAULT 0,
        taxes DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'upi',
        status VARCHAR(50) DEFAULT 'preparing',
        estimated_time VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);

    // Order items table
    await query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        menu_item_id INTEGER,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        quantity INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Favorites table
    await query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, menu_item_id)
      )
    `);

    // Create indexes for better performance
    await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_menu_items_popular ON menu_items(is_popular)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id)`);

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

// Seed database with sample data
export const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database with sample data...');

    // Check if data already exists
    const existingItems = await query('SELECT COUNT(*) FROM menu_items');
    if (parseInt(existingItems.rows[0].count) > 0) {
      console.log('📊 Database already has data, skipping seed');
      return;
    }

    // Sample menu items
    const menuItems = [
      // Burgers
      {
        name: 'Classic Beef Burger',
        description: 'Juicy beef patty with lettuce, tomato, and special sauce',
        price: 12.99,
        category: 'Burgers',
        rating: 4.5,
        is_popular: true,
        image_url: '/api/placeholder/300/200',
      },
      {
        name: 'Chicken Deluxe',
        description: 'Grilled chicken breast with avocado and bacon',
        price: 14.99,
        category: 'Burgers',
        rating: 4.7,
        is_popular: true,
        image_url: '/api/placeholder/300/200',
      },
      {
        name: 'Veggie Supreme',
        description: 'Plant-based patty with fresh vegetables',
        price: 11.99,
        category: 'Burgers',
        rating: 4.3,
        is_popular: false,
        image_url: '/api/placeholder/300/200',
      },

      // Pizza
      {
        name: 'Margherita Pizza',
        description: 'Classic tomato sauce, mozzarella, and fresh basil',
        price: 16.99,
        category: 'Pizza',
        rating: 4.6,
        is_popular: true,
        image_url: '/api/placeholder/300/200',
      },
      {
        name: 'Pepperoni Supreme',
        description: 'Loaded with pepperoni and extra cheese',
        price: 19.99,
        category: 'Pizza',
        rating: 4.8,
        is_popular: true,
        image_url: '/api/placeholder/300/200',
      },
      {
        name: 'BBQ Chicken Pizza',
        description: 'BBQ sauce, grilled chicken, red onions, and cilantro',
        price: 21.99,
        category: 'Pizza',
        rating: 4.4,
        is_popular: false,
        image_url: '/api/placeholder/300/200',
      },

      // Pasta
      {
        name: 'Spaghetti Carbonara',
        description: 'Creamy pasta with bacon and parmesan cheese',
        price: 15.99,
        category: 'Pasta',
        rating: 4.5,
        is_popular: true,
        image_url: '/api/placeholder/300/200',
      },
      {
        name: 'Penne Arrabbiata',
        description: 'Spicy tomato sauce with garlic and herbs',
        price: 13.99,
        category: 'Pasta',
        rating: 4.2,
        is_popular: false,
        image_url: '/api/placeholder/300/200',
      },

      // Desserts
      {
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with molten center',
        price: 7.99,
        category: 'Desserts',
        rating: 4.9,
        is_popular: true,
        image_url: '/api/placeholder/300/200',
      },
      {
        name: 'Tiramisu',
        description: 'Classic Italian dessert with coffee and mascarpone',
        price: 6.99,
        category: 'Desserts',
        rating: 4.6,
        is_popular: false,
        image_url: '/api/placeholder/300/200',
      },

      // Beverages
      {
        name: 'Fresh Orange Juice',
        description: 'Freshly squeezed orange juice',
        price: 4.99,
        category: 'Beverages',
        rating: 4.3,
        is_popular: false,
        image_url: '/api/placeholder/300/200',
      },
      {
        name: 'Iced Coffee',
        description: 'Cold brew coffee with ice and cream',
        price: 5.99,
        category: 'Beverages',
        rating: 4.4,
        is_popular: true,
        image_url: '/api/placeholder/300/200',
      },
    ];

    // Insert menu items
    for (const item of menuItems) {
      await query(
        `INSERT INTO menu_items (name, description, price, category, rating, is_popular, image_url) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          item.name,
          item.description,
          item.price,
          item.category,
          item.rating,
          item.is_popular,
          item.image_url,
        ]
      );
    }

    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};
