# Zordr Backend

Complete backend API server for the Zordr food ordering application built with Node.js, Express, and PostgreSQL.

## 🚀 Features

- **Express.js REST API** with comprehensive endpoints
- **JWT Authentication** with secure token management
- **PostgreSQL Database** with optimized schema
- **Cart Management** with real-time updates
- **Order Processing** with status tracking
- **User Profiles** with favorites and loyalty points
- **CORS enabled** for frontend integration
- **Rate limiting** and security middleware
- **Comprehensive error handling**
- **Database seeding** with sample data

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## ⚡ Quick Start

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd zordr-backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Database Setup:**
   - Create a PostgreSQL database named `zordr`
   - Update database credentials in `.env` file

4. **Environment Configuration:**

   ```bash
   cp env.example .env
   ```

   Update the `.env` file with your configuration.

5. **Start the server:**

   **Development mode (with auto-reload):**

   ```bash
   npm run dev
   ```

   **Production mode:**

   ```bash
   npm start
   ```

The server will start on `http://localhost:3000` and automatically initialize the database schema.

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication

Most endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication Endpoints

### Sign Up

```http
POST /api/auth/signup
```

**Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "outlet": "main",
  "password": "password123"
}
```

### Sign In

```http
POST /api/auth/signin
```

**Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Current User

```http
GET /api/auth/me
```

**Headers:** `Authorization: Bearer <token>`

### Refresh Token

```http
POST /api/auth/refresh
```

**Headers:** `Authorization: Bearer <token>`

---

## 🍔 Menu Endpoints

### Get All Menu Items

```http
GET /api/menu/items?category=Burgers&search=chicken&limit=20&offset=0
```

### Get Popular Items

```http
GET /api/menu/popular?category=Pizza&limit=10
```

### Get Menu by Outlet

```http
GET /api/menu/outlet/:outletId?category=Desserts
```

### Get Single Menu Item

```http
GET /api/menu/items/:itemId
```

### Get Categories

```http
GET /api/menu/categories
```

---

## 🛒 Cart Endpoints

_All cart endpoints require authentication_

### Get User's Cart

```http
GET /api/cart
```

### Add Item to Cart

```http
POST /api/cart/add
```

**Body:**

```json
{
  "itemId": 1,
  "quantity": 2
}
```

### Update Item Quantity

```http
PUT /api/cart/update
```

**Body:**

```json
{
  "itemId": 1,
  "quantity": 3
}
```

### Remove Item from Cart

```http
DELETE /api/cart/remove/:itemId
```

### Clear Cart

```http
DELETE /api/cart/clear
```

---

## 📦 Order Endpoints

_All order endpoints require authentication_

### Get User's Orders

```http
GET /api/orders?status=preparing&limit=10&offset=0
```

### Get Single Order

```http
GET /api/orders/:orderId
```

### Create New Order

```http
POST /api/orders
```

**Body:**

```json
{
  "items": [
    {
      "id": 1,
      "quantity": 2
    }
  ],
  "paymentMethod": "card",
  "outletId": "main",
  "useLoyaltyPoints": false,
  "deliveryAddress": "123 Main St",
  "specialInstructions": "Extra spicy"
}
```

### Update Order Status (Admin)

```http
PUT /api/orders/:orderId/status
```

**Body:**

```json
{
  "status": "preparing",
  "estimatedTime": "20-25 mins"
}
```

### Cancel Order

```http
PUT /api/orders/:orderId/cancel
```

**Body:**

```json
{
  "reason": "Changed mind"
}
```

---

## 👤 User Endpoints

_All user endpoints require authentication_

### Get User Profile

```http
GET /api/user/profile
```

### Update User Profile

```http
PUT /api/user/profile
```

**Body:**

```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com",
  "outlet": "downtown",
  "avatar": "https://example.com/avatar.jpg"
}
```

### Get User's Favorites

```http
GET /api/user/favorites?limit=20&offset=0
```

### Add Item to Favorites

```http
POST /api/user/favorites
```

**Body:**

```json
{
  "itemId": 1
}
```

### Remove Item from Favorites

```http
DELETE /api/user/favorites/:itemId
```

### Check if Item is Favorited

```http
GET /api/user/favorites/check/:itemId
```

### Get User Statistics

```http
GET /api/user/stats
```

---

## 🏗️ Project Structure

```
zordr-backend/
├── db/
│   ├── database.js     # Database connection and query helpers
│   └── schema.js       # Database schema and seeding
├── middleware/
│   └── auth.js         # Authentication middleware
├── routes/
│   ├── auth.js         # Authentication routes
│   ├── menu.js         # Menu management routes
│   ├── cart.js         # Cart management routes
│   ├── orders.js       # Order processing routes
│   └── user.js         # User profile routes
├── server.js           # Main server file
├── package.json        # Dependencies and scripts
├── env.example         # Environment variables template
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## 🗄️ Database Schema

### Tables

- **users** - User accounts and profiles
- **menu_items** - Food items and details
- **carts** - User shopping carts
- **cart_items** - Items in carts
- **orders** - Order records
- **order_items** - Items in orders
- **favorites** - User favorite items

## 🔧 Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zordr
DB_USER=postgres
DB_PASSWORD=your_password

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

## 🛡️ Security Features

- JWT token authentication
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- Input validation
- SQL injection prevention
- Helmet security headers

## 🚦 Order Status Flow

1. **confirmed** - Order placed and confirmed
2. **preparing** - Kitchen is preparing the order
3. **ready** - Order is ready for pickup/delivery
4. **out_for_delivery** - Order is being delivered
5. **delivered** - Order completed successfully
6. **cancelled** - Order was cancelled

## 🎯 Response Format

All API responses follow this format:

**Success Response:**

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

## 🧪 Development

The server uses nodemon for development with automatic restarts on file changes.

**Available Scripts:**

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run tests (to be implemented)

## 📝 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support, email support@zordr.com or create an issue in the repository.
